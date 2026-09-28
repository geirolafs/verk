# frozen_string_literal: true

require "minitest/autorun"
require "tmpdir"
require_relative "../lib/workspace"

class WorkspaceTest < Minitest::Test
  def test_slugify
    assert_equal "the-it-department", Workspace.slugify("The IT Department")
    assert_equal "evil-corp", Workspace.slugify("  Evil   Corp ")
    assert_equal "throun-a-vef-v2", Workspace.slugify("Þróun Á Vef — v2!")
    assert_equal "hidden", Workspace.slugify(".hidden")
    assert_equal "", Workspace.slugify("!!!")
  end

  def test_slugify_try_keeps_date
    assert_equal "2026-09-28-my-spike", Workspace.slugify_try("2026-09-28-My Spike")
    assert_equal "my-spike", Workspace.slugify_try("My Spike")
  end

  def test_complete_client_prefix_first
    clients = %w[acme evil-corp the-it-department]
    assert_equal %w[acme], Workspace.complete_client(clients, "ac")
    assert_equal %w[evil-corp acme the-it-department], Workspace.complete_client(clients, "e")
    assert_equal clients, Workspace.complete_client(clients, "")
    assert_equal %w[the-it-department], Workspace.complete_client(clients, "The IT")
  end

  def test_scan_projects_and_clients
    Dir.mktmpdir do |root|
      Dir.mkdir(File.join(root, "tries"))
      Dir.mkdir(File.join(root, "website"))
      Dir.mkdir(File.join(root, ".archive"))
      Dir.mkdir(File.join(root, "acme"))
      File.write(File.join(root, "acme", ".try-group"), "")
      Dir.mkdir(File.join(root, "acme", "api"))

      rows = Workspace.scan_projects(root, [Workspace.realpath(File.join(root, "tries"))])
      got = rows.map { |r| [r[:kind], r[:rel]] }
      assert_equal [[:client, "acme"], [:project, "acme/api"], [:project, "website"]], got
      assert_equal ["acme"], Workspace.clients(root)
    end
  end

  def test_client_empty
    Dir.mktmpdir do |root|
      client = File.join(root, "acme")
      Dir.mkdir(client)
      File.write(File.join(client, ".try-group"), "")
      assert Workspace.client_empty?(client)
      Dir.mkdir(File.join(client, "api"))
      refute Workspace.client_empty?(client)
      assert Workspace.client_empty?(client, [Workspace.realpath(File.join(client, "api"))])
      File.write(File.join(client, "notes.txt"), "x")
      refute Workspace.client_empty?(client, [Workspace.realpath(File.join(client, "api"))])
    end
  end

  def test_claude_key
    assert_equal "-home-go-Src-omarchy-imac", Workspace.claude_key("/home/go/Src/omarchy-imac")
    assert_equal "-home-go-Src-a-b-c", Workspace.claude_key("/home/go/Src/a.b_c")
  end

  def test_claude_move_renames_and_merges
    Dir.mktmpdir do |cfg|
      old_env = ENV['CLAUDE_CONFIG_DIR']
      ENV['CLAUDE_CONFIG_DIR'] = cfg
      begin
        projects = File.join(cfg, "projects")
        src = File.join(projects, Workspace.claude_key("/a/old"))
        dst = File.join(projects, Workspace.claude_key("/a/new"))
        Dir.mkdir(projects)
        Dir.mkdir(src)
        Dir.mkdir(File.join(src, "memory"))
        File.write(File.join(src, "s1.jsonl"), "one")
        File.write(File.join(src, "memory", "MEMORY.md"), "- [a](a.md)\n- [same](same.md)\n")
        File.write(File.join(src, "memory", "note.md"), "from old")

        assert_nil Workspace.claude_move("/a/missing", "/a/new")
        assert_match(/moved/, Workspace.claude_move("/a/old", "/a/new"))
        assert File.exist?(File.join(dst, "s1.jsonl"))
        refute Dir.exist?(src)

        # Second move into the now-existing destination merges
        Dir.mkdir(src)
        Dir.mkdir(File.join(src, "memory"))
        File.write(File.join(src, "s2.jsonl"), "two")
        File.write(File.join(src, "memory", "MEMORY.md"), "- [same](same.md)\n- [b](b.md)\n")
        File.write(File.join(src, "memory", "note.md"), "different")
        assert_match(/merged/, Workspace.claude_move("/a/old", "/a/new"))
        assert File.exist?(File.join(dst, "s2.jsonl"))
        index = File.read(File.join(dst, "memory", "MEMORY.md"))
        assert_equal ["- [a](a.md)", "- [same](same.md)", "- [b](b.md)"], index.split("\n")
        assert_equal "from old", File.read(File.join(dst, "memory", "note.md"))
        assert_equal "different", File.read(File.join(dst, "memory", "note-2.md"))
        refute Dir.exist?(src)

        # A session that kept running across the move: its transcript is
        # appended, not renamed (Claude finds sessions by file name)
        Dir.mkdir(src)
        File.write(File.join(src, "s1.jsonl"), "{\"later\":1}\n")
        Workspace.claude_move("/a/old", "/a/new")
        assert_equal "one\n{\"later\":1}\n", File.read(File.join(dst, "s1.jsonl"))
        refute File.exist?(File.join(dst, "s1-2.jsonl"))
      ensure
        ENV['CLAUDE_CONFIG_DIR'] = old_env
      end
    end
  end
end
