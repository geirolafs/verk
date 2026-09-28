# frozen_string_literal: true

# Projects layer ("verk"): long-lived projects next to the tries directory.
#
# Enabled when TRY_PROJECTS is set. Layout under the projects root:
#
#   <root>/tries/               💭  tries (TRY_PATH), date-prefixed scratch dirs
#   <root>/<name>/                  project
#   <root>/<client>/.try-group      client (shown as client/): holds projects
#   <root>/<client>/<name>/         project filed under a client
#   <root>/.archive/...         📦  archived projects, same client/name layout
#
# Everything here is plain stdlib and Spinel-friendly (no FileUtils).
module Workspace
  GROUP_MARKER = ".try-group"
  ARCHIVE_DIR = ".archive"
  DATE_PREFIX_RE = /\A\d{4}-\d{2}-\d{2}-/

  TRANSLIT = {
    "á" => "a", "à" => "a", "â" => "a", "ä" => "a", "å" => "a", "ã" => "a",
    "é" => "e", "è" => "e", "ê" => "e", "ë" => "e",
    "í" => "i", "ì" => "i", "î" => "i", "ï" => "i",
    "ó" => "o", "ò" => "o", "ô" => "o", "ö" => "o", "ø" => "o", "õ" => "o",
    "ú" => "u", "ù" => "u", "û" => "u", "ü" => "u",
    "ý" => "y", "ÿ" => "y", "ñ" => "n", "ç" => "c",
    "ð" => "d", "þ" => "th", "æ" => "ae", "œ" => "oe", "ß" => "ss"
  }.freeze

  # "The IT Department" -> "the-it-department", "Þróun Á Vef" -> "throun-a-vef"
  def self.slugify(text)
    out = String.new
    text.to_s.downcase.each_char { |c| out << (TRANSLIT[c] || c) }
    out = out.gsub(/[^a-z0-9._]+/, '-')
    out = out.gsub(/-+/, '-')
    out = out.sub(/\A[-.]+/, '')
    out.sub(/[-.]+\z/, '')
  end

  # Slugify a try name while keeping an optional YYYY-MM-DD- prefix intact.
  def self.slugify_try(name)
    name = name.to_s.strip
    if name =~ /\A(\d{4}-\d{2}-\d{2})-(.*)\z/m
      rest = slugify($2)
      rest.empty? ? $1 : "#{$1}-#{rest}"
    else
      slugify(name)
    end
  end

  def self.strip_date(name)
    name.to_s.sub(DATE_PREFIX_RE, '')
  end

  def self.realpath(path)
    File.realpath(path.to_s)
  rescue
    File.expand_path(path.to_s)
  end

  def self.group?(path)
    File.file?(File.join(path.to_s, GROUP_MARKER))
  end

  def self.archive_root(root)
    File.join(root.to_s, ARCHIVE_DIR)
  end

  def self.safe_stat(path)
    File.stat(path)
  rescue
    nil
  end

  # Visible child directories of dir, sorted, as [name, path, stat].
  def self.child_dirs(dir)
    found = []
    return found unless Dir.exist?(dir.to_s)
    Dir.foreach(dir.to_s) do |name|
      next if name.start_with?('.')
      path = File.join(dir.to_s, name)
      stat = safe_stat(path)
      next unless stat && stat.directory?
      found << [name, path, stat]
    end
    found.sort_by { |item| item[0] }
  end

  # Names of existing clients under root.
  def self.clients(root)
    names = []
    child_dirs(root).each do |name, path, _stat|
      names << name if group?(path)
    end
    names
  end

  def self.row(kind, rel, path, stat)
    { kind: kind, rel: rel, path: path, mtime: stat.mtime, ctime: stat.ctime }
  end

  # Projects and clients under root. Skips hidden entries and any directory
  # whose realpath is in skip_real (the tries directory).
  def self.scan_projects(root, skip_real)
    rows = []
    child_dirs(root).each do |name, path, stat|
      real = realpath(path)
      next if skip_real.include?(real)
      if group?(path)
        rows << row(:client, name, real, stat)
        child_dirs(path).each do |cname, cpath, cstat|
          rows << row(:project, "#{name}/#{cname}", realpath(cpath), cstat)
        end
      else
        rows << row(:project, name, real, stat)
      end
    end
    rows
  end

  # Archived projects (no client rows).
  def self.scan_archive(root)
    rows = []
    archive = archive_root(root)
    child_dirs(archive).each do |name, path, stat|
      if group?(path)
        child_dirs(path).each do |cname, cpath, cstat|
          rows << row(:archived, "#{name}/#{cname}", realpath(cpath), cstat)
        end
      else
        rows << row(:archived, name, realpath(path), stat)
      end
    end
    rows
  end

  # True when a client folder holds nothing but its marker (and folders listed
  # in ignoring, which are about to be archived), so rmdir will succeed.
  def self.client_empty?(path, ignoring = [])
    return false unless Dir.exist?(path.to_s)
    empty = true
    Dir.foreach(path.to_s) do |name|
      next if name == '.' || name == '..' || name == GROUP_MARKER
      child = File.join(path.to_s, name)
      empty = false unless File.directory?(child) && ignoring.include?(realpath(child))
    end
    empty
  end

  # First free "path", "path-2", "path-3", ...
  def self.free_path(path)
    return path unless File.exist?(path)
    i = 2
    loop do
      candidate = "#{path}-#{i}"
      return candidate unless File.exist?(candidate)
      i += 1
    end
  end

  # Suggestions for the client prompt: prefix matches first, then substring.
  def self.complete_client(clients, typed)
    want = slugify(typed)
    return clients.dup if want.empty?
    prefix = clients.select { |c| c.start_with?(want) }
    rest = clients.select { |c| !c.start_with?(want) && c.include?(want) }
    prefix + rest
  end

  # --- Claude Code history ---------------------------------------------------
  # Claude Code keeps sessions and memory in ~/.claude/projects/<key>, where key
  # is the absolute working directory with every non-alphanumeric char as '-'.
  # When a folder moves, move its key folder too so history follows the project.

  def self.claude_projects_dir
    base = ENV['CLAUDE_CONFIG_DIR'].to_s
    base = File.expand_path("~/.claude") if base.empty?
    File.join(base, "projects")
  end

  def self.claude_key(path)
    path.to_s.gsub(/[^a-zA-Z0-9]/, '-')
  end

  # Returns a short status string, or nil when there was nothing to move.
  def self.claude_move(old_path, new_path)
    dir = claude_projects_dir
    src = File.join(dir, claude_key(old_path))
    dst = File.join(dir, claude_key(new_path))
    return nil if src == dst || !Dir.exist?(src)
    if File.exist?(dst)
      merge_dir(src, dst)
      "Claude history merged into #{File.basename(dst)}"
    else
      File.rename(src, dst)
      "Claude history moved to #{File.basename(dst)}"
    end
  end

  def self.merge_dir(src, dst)
    Dir.foreach(src) do |name|
      next if name == '.' || name == '..'
      s = File.join(src, name)
      d = File.join(dst, name)
      if !File.exist?(d) && !File.symlink?(d)
        File.rename(s, d)
      elsif File.directory?(s) && !File.symlink?(s) && File.directory?(d) && !File.symlink?(d)
        merge_dir(s, d)
      elsif name == "MEMORY.md"
        merge_memory_index(s, d)
        File.delete(s)
      elsif name.end_with?(".jsonl") && File.file?(s) && File.file?(d)
        # Same session written under both paths (it kept running across a
        # move): the old-path file holds the later messages, so append it.
        append_file(s, d)
        File.delete(s)
      elsif File.file?(s) && File.file?(d) && File.read(s) == File.read(d)
        File.delete(s)
      else
        File.rename(s, free_file(d))
      end
    end
    begin
      Dir.rmdir(src)
    rescue
    end
  end

  # Append index lines from src that dst does not already have.
  def self.merge_memory_index(src, dst)
    have = File.read(dst).split("\n")
    add = File.read(src).split("\n").select { |l| !l.strip.empty? && !have.include?(l) }
    return if add.empty?
    text = File.read(dst)
    text += "\n" unless text.empty? || text.end_with?("\n")
    File.write(dst, text + add.join("\n") + "\n")
  end

  def self.append_file(src, dst)
    text = File.read(src)
    return if text.empty?
    existing = File.read(dst)
    text = "\n" + text unless existing.empty? || existing.end_with?("\n")
    File.open(dst, 'a') { |f| f.write(text) }
  end

  # "notes.md" -> "notes-2.md" (first free)
  def self.free_file(path)
    ext = File.extname(path)
    stem = ext.empty? ? path : path[0, path.length - ext.length]
    i = 2
    loop do
      candidate = "#{stem}-#{i}#{ext}"
      return candidate unless File.exist?(candidate)
      i += 1
    end
  end
end
