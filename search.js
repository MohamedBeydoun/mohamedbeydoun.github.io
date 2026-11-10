(() => {
  const form = document.querySelector('form[role="search"]');
  const input = document.querySelector('#q');
  const results = document.querySelector('#search-results');
  const heading = document.querySelector('#search-results-title');
  const status = document.querySelector('#search-status');
  const matches = document.querySelector('#search-matches');
  const clearButton = document.querySelector('#clear-search');

  function contentText(element) {
    const copy = element.cloneNode(true);
    copy.querySelectorAll('nav, script, style').forEach(node => node.remove());
    const walker = document.createTreeWalker(copy, NodeFilter.SHOW_TEXT);
    const parts = [];
    while (walker.nextNode()) parts.push(walker.currentNode.textContent);
    return parts.join(' ').replace(/\s+/g, ' ').trim();
  }

  const index = [...document.querySelectorAll('main > [id]:not(#search-results), #credits')].map(section => {
    const text = contentText(section);
    return { section, title: section.querySelector('h1, h2').textContent.trim(), text, searchable: text.toLowerCase() };
  });

  function clearSearch() {
    input.value = '';
    matches.replaceChildren();
    status.textContent = '';
    results.hidden = true;
    input.focus();
  }

  function addResult(entry, terms) {
    const item = document.createElement('li');
    const title = document.createElement('h3');
    const link = document.createElement('a');
    const snippet = document.createElement('p');
    const firstMatch = Math.min(...terms.map(term => entry.searchable.indexOf(term)));
    const start = Math.max(0, firstMatch - 50);
    const end = Math.min(entry.text.length, start + 200);

    link.href = `#${entry.section.id}`;
    link.textContent = entry.title;
    snippet.textContent = `${start ? '...' : ''}${entry.text.slice(start, end)}${end < entry.text.length ? '...' : ''}`;
    link.addEventListener('click', () => {
      entry.section.querySelectorAll('details').forEach(detail => {
        if (terms.some(term => contentText(detail).toLowerCase().includes(term))) detail.open = true;
      });
      entry.section.setAttribute('tabindex', '-1');
      entry.section.focus({ preventScroll: true });
      entry.section.scrollIntoView();
    });
    title.append(link);
    item.append(title, snippet);
    matches.append(item);
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const query = input.value.trim();
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
    const found = terms.length ? index.filter(entry => terms.every(term => entry.searchable.includes(term))) : [];

    matches.replaceChildren();
    found.forEach(entry => addResult(entry, terms));
    status.textContent = !terms.length ? 'Enter a search term to search this website.'
      : !found.length ? `No results for "${query}". Try another search term.`
      : `${found.length} ${found.length === 1 ? 'section' : 'sections'} found for "${query}".`;
    results.hidden = false;
    heading.focus();
  });

  clearButton.addEventListener('click', clearSearch);
  input.addEventListener('input', () => {
    if (!input.value.trim()) clearSearch();
  });

  document.querySelector('#search-fallback').hidden = true;
  form.hidden = false;
})();
