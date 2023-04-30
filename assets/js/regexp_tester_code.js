const REGEXP_TESTER_CLASS = 'TestRegexp';

const REGEXP_TESTER_CODE = `
require 'js'

class ${REGEXP_TESTER_CLASS}
  NULL = JS.eval('null')

  def self.call(...)
    new(...).call
  end

  def initialize(regexp_string, flags, test_text)
    @regexp_string = regexp_string
    @flags = flags
    @test_text = test_text
  end

  def call
    matches, captures = collect_results
    build_js_result(matches:, captures:)
  rescue StandardError
    build_js_result
  end

  private

  def collect_results
    regexp = Regexp.new(@regexp_string, @flags)
    @test_text.to_enum(:scan, regexp).inject([Set.new, []]) do |(matches, captures)|
      match_data = Regexp.last_match
      match_data_captures = if match_data.named_captures.any?
                              match_data.named_captures
                            else
                              match_data.captures.each_with_index.to_h { |capture, index| [index.next, capture] }
                            end

      [matches << match_data[0], match_data_captures.any? ? captures << match_data_captures : captures]
    end
  end

  def build_js_result(matches: [], captures: [])
    build_js_object(
      ['match'.to_js, matches.any?],
      ['matches'.to_js, build_js_array(*matches.map(&:to_js))],
      [
        'captures'.to_js,
        build_js_array(
          *captures.map do |capture|
            build_js_object(*capture.map { |key_match| key_match.map(&:to_js) } )
          end
        )
      ]
    )
  end

  def build_js_object(*entries)
    JS.global[:Object].call(
      :fromEntries, build_js_array(*entries.map { |entry_data| build_js_array(*entry_data) })
    )
  end

  def build_js_array(*args)
    JS.global[:Array].call(:call, NULL, *args)
  end
end
`;



export { REGEXP_TESTER_CODE, REGEXP_TESTER_CLASS };
