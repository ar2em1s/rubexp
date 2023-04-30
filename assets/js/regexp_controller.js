import { Controller } from '@hotwired/stimulus';
import { DefaultRubyVM } from 'ruby-3_2-wasm-wasi/dist/browser.umd.js';
import RubyWasmBinary from 'ruby-3_2-wasm-wasi/dist/ruby+stdlib.wasm';

import { REGEXP_TESTER_CODE, REGEXP_TESTER_CLASS } from './regexp_tester_code';

export default class extends Controller {
  static targets = [
    'content', 'contentSkeleton', 'regexp', 'flags', 'testText', 'resultsSkeleton', 'noResults', 'results', 'captures',
    'capturesContainer', 'capturesContainerSkeleton'
  ];
  static classes = ['hidden']

  async connect() {
    await this._initializeRuby();
    this._displayContent();
  }

  test() {
    this._displayResultsPending();

    const requiredFieldsEmpty = ![this.regexpTarget, this.testTextTarget].every((target) => target.value)
    if(requiredFieldsEmpty) return this._displayNoResults();

    const params = this._buildTestParams();
    const result = this.regexpTester.call('call', ...params).toJS();

    result.match ? this._displayResults(result) : this._displayNoResults();
  }

  async _initializeRuby() {
    const module = await WebAssembly.compile(RubyWasmBinary);
    const { vm } = await DefaultRubyVM(module);
    await vm.evalAsync(REGEXP_TESTER_CODE);

    this.vm = vm;
    this.regexpTester = await this.vm.evalAsync(REGEXP_TESTER_CLASS);
  }

  _displayContent() {
    this.contentSkeletonTarget.classList.toggle(this.hiddenClass, true);
    this.contentTarget.classList.toggle(this.hiddenClass, false);
  }

  _buildTestParams() {
    return [this.regexpTarget, this.flagsTarget, this.testTextTarget].map(
      (target) => this.vm.wrap(target.value).call('to_s')
    );
  }

  _displayResultsPending() {
    [this.resultsTarget, this.noResultsTarget, this.capturesContainerTarget].forEach(
      (target) => target.classList.toggle(this.hiddenClass, true)
    );
    [this.resultsSkeletonTarget, this.capturesContainerSkeletonTarget].forEach(
      (target) => target.classList.toggle(this.hiddenClass, false)
    );
  }

  _displayNoResults() {
    [
      this.resultsSkeletonTarget, this.capturesContainerSkeletonTarget, this.resultsTarget,
      this.capturesContainerTarget
    ].forEach((target) => target.classList.toggle(this.hiddenClass, true))
    this.noResultsTarget.classList.toggle(this.hiddenClass, false);
  }

  _displayResults({ matches, captures }) {
    this._displayMatches(matches)
    this._displayCaptures(captures);

    [this.resultsSkeletonTarget, this.capturesContainerSkeletonTarget, this.noResultsTarget].forEach(
      (target) => target.classList.toggle(this.hiddenClass, true)
    );
    this.resultsTarget.classList.toggle(this.hiddenClass, false);
    this.capturesContainerTarget.classList.toggle(this.hiddenClass, captures.length === 0);
  }

  _displayMatches(matches) {
    const highlightedText = matches.reduce(
      (text, match) => {
        const highlightedMatch = document.createElement('span');
        const matchText = document.createTextNode(match);
        highlightedMatch.append(matchText);
        highlightedMatch.classList.add('text-gray-900', 'bg-slate-50');

        return text.replaceAll(match, highlightedMatch.outerHTML);
      },
      this.testTextTarget.value
    );

    this.resultsTarget.innerHTML = highlightedText;
  }

  _displayCaptures(matchCaptures) {
    const captures = matchCaptures.map((capture, index) => {
      const title = document.createTextNode(`Match ${index + 1}:`);
      const titleElement = document.createElement('h4');
      titleElement.append(title);

      const captureItemsElement = document.createElement('ul');
      captureItemsElement.classList.add('text-lg');

      const captureItems = Object.entries(capture).map(([key, item]) => {
        const itemElement = document.createElement('li');
        const captureText = document.createTextNode(`${key}: ${item}`);
        itemElement.append(captureText);

        return itemElement;
      })
      captureItemsElement.append(...captureItems);

      const captureElement = document.createElement('div');
      captureElement.classList.add(
        'p-2', 'flex', 'flex-col', 'gap-2', 'border', 'border-slate-50', 'drop-shadow-md', 'rounded'
      );
      captureElement.append(titleElement, captureItemsElement);

      return captureElement;
    })

    this.capturesTarget.replaceChildren(...captures);
  }
}
