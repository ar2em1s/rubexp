module Jekyll
  class InlineCssTag < Liquid::Tag
    def initialize(_, path_to_atf_css, _)
      super
      full_path_to_atf_css = File.expand_path(path_to_atf_css.delete('"').strip)
      @atf_css_raw = File.read(full_path_to_atf_css)
    end

    def render(_)
      "<style type=\"text/css\" media=\"screen\">#{@atf_css_raw}</style>"
    end
  end
end

Liquid::Template.register_tag(:inline_css, Jekyll::InlineCssTag)
