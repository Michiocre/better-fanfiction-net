/**
 * @param {string} tag 
 * @param {string|string[]} classes 
 * @param {...(string|HTMLElement|HTMLElement[]|function)} modifiers  TextNode or a modifier function
 */
function createElement(tag, classes, ...modifiers) {
    let el = document.createElement(tag);
    if (classes) {
        if (Array.isArray(classes)) {
            el.classList.add(...classes);
        } else {
            el.classList.add(classes);
        }
    }
    for (const mod of modifiers) {
        if (typeof mod === 'boolean' && !mod) {
            continue;
        }

        if (typeof mod === 'string') {
            el.appendChild(document.createTextNode(mod));
        }
        else if (mod instanceof Node) {
            el.appendChild(mod);   
        } 
        else if (Array.isArray(mod)) {
            el.append(...mod)
        }
        else if (typeof mod === 'function') {
            mod(el);
        } else {
            console.warn('Unhandled modifier:', typeof mod, mod, el);
        }
    }
    return el;
}

/**
 * Returns the From used on the Search Page
 * @param {object} params 
 * @param {object[]} fandomList 
 * @returns {HTMLFormElement}
 */
function createSearchForm(params, fandomList, sortOptions) {
    let form = createElement('form', null, 
        f => f.id = 'bff-search-form',
        createElement('div', 'bff-form-container',
            createElement('h3', null, 'BetterFF Search'),
            createElement('div', 'bff-row',
                createElement('label', 'bff-label', 'Title'),
                createElement('input', 'bff-input',
                    input => input.type = 'text',
                    input => input.name = 'title',
                    input => input.placeholder = 'Title',
                    input => input.value = params.title
                )
            ),
            createElement('div', 'bff-row', 
                createElement('label', 'bff-label', 'Description'),
                createElement('input', 'bff-input',
                    input => input.type = 'text',
                    input => input.name = 'description',
                    input => input.placeholder = 'Description',
                    input => input.value = params.description
                )
            ),
            createElement('div', 'bff-row', 
                createElement('label', 'bff-label', 'Fandom'),
                createElement('input', 'bff-input',
                    input => input.id = 'bff-fandom-input',
                    input => input.type = 'text',
                    input => input.name = 'fandom',
                    input => input.placeholder = 'Fandom',
                    input => input.value = params.fandom,
                    input => input.setAttribute('list', 'bff-fandom-list')
                )
            ),
            createElement('datalist', null,
                list => list.id = 'bff-fandom-list',
                ...fandomList.map(listItem => createElement('option', null, 
                    option => option.value = listItem.name
                ))
            ),
            createElement('div', 'bff-row', 
                createElement('label', 'bff-label', 'Last Update after'),
                createElement('input', 'bff-input',
                    input => input.id = 'bff-datefrom',
                    input => input.type = 'date',
                    input => input.name = 'datefrom',
                    input => input.value = params.datefrom
                )
            ),
            createElement('div', 'bff-row', 
                createElement('label', 'bff-label', 'Last Update before'),
                createElement('input', 'bff-input',
                    input => input.id = 'bff-dateuntil',
                    input => input.type = 'date',
                    input => input.name = 'dateuntil',
                    input => input.value = params.dateuntil
                )
            ),
            createElement('div', 'bff-row', 
                createElement('label', 'bff-label', 'Published after'),
                createElement('input', 'bff-input',
                    input => input.id = 'bff-pubDateFrom',
                    input => input.type = 'date',
                    input => input.name = 'pubDateFrom',
                    input => input.value = params.pubDateFrom
                )
            ),
            createElement('div', 'bff-row', 
                createElement('label', 'bff-label', 'Published before'),
                createElement('input', 'bff-input',
                    input => input.id = 'bff-pubDateUntil',
                    input => input.type = 'date',
                    input => input.name = 'pubDateUntil',
                    input => input.value = params.pubDateUntil
                )
            ),
            createElement('div', 'bff-row', 
                createElement('label', 'bff-label', 'Order by'),
                createElement('select', 'bff-input',
                    input => input.type = 'dropdown',
                    input => input.name = 'sort',
                    input => input.append(
                        ...sortOptions.map(sortItem => createElement('option', null,
                            option => option.value = sortItem.value,
                            option => option.selected = sortItem.selected,
                            sortItem.name
                        ))
                    )
                )
            ),
            createElement('button', 'btn', 
                btn => btn.id = 'bff-search-button',
                btn => btn.type = 'submit',
                'Search'
            ),
            createElement('button', 'btn', 
                btn => btn.id = 'bff-search-button-hidden',
                btn => btn.type = 'button',
                'Oh no i have been found'
            )
        ),
        createElement('input', null, 
            input => input.id = 'bff-limit',
            input => input.type = 'hidden',
            input => input.name = 'limit',
            input => input.value = params.limit
        ),
        createElement('input', null, 
            input => input.id = 'bff-page',
            input => input.type = 'hidden',
            input => input.name = 'page',
            input => input.value = params.page
        )
    );
    return form;
}

/**
 * Creates the HTMLElement for a given story
 * @param {Story} data
 * @returns {HTMLDivElement}
 */
function createStory(data) {
    return createElement('div', null, 
        createElement('div', ['z-list', 'zhover', 'zpointer'], 
            zlist => zlist.style = 'min-height:77px;border-bottom:1px #cdcdcd solid;',
            createElement('a', 'stitle', 
                titleLink => titleLink.href = `/s/${data.id}`,
                createElement('img', ['lazy', 'cimage'], 
                    img => img.style = 'clear: left; float: left; margin-right: 3px; padding: 2px; border: 1px solid rgb(204, 204, 204); border-radius: 2px; display: block;',
                    img => img.src = data.image_id ? `/image/${data.image_id}/75/` : '/static/images/d_60_90.jpg',
                    img =>img.width = '50',
                    img =>img.height = '66'
                ),
                titleLink => {
                    data.title = data.title.replaceAll('&amp;', '&');
                    let parts = data.title.split(/<\/?b>/);
                    for (let i = 0; i < parts.length; i++) {
                        if (i % 2 === 0) {
                            titleLink.appendChild(document.createTextNode(parts[i]));
                        } else {
                            titleLink.appendChild(createElement('b', null, parts[i]));
                        }
                    }
                }
            ),
            ' ',
            data.chapters > 1 && createElement('a', null, 
                chapterLink => chapterLink.href = `/s/${data.id}/${data.chapters}`,
                createElement('span', ['icon-chevron-right', 'xicon-section-arrow'])
            ),
            ' by ',
            createElement('a', null, 
                authorLink => authorLink.href = `/u/${data.author_id}`,
                data.author_name
            ),
            ' ',
            data.reviews > 0 && createElement('a', 'reviews', 
                chapterLink => chapterLink.href = `/r/${data.id}`,
                'reviews'
            ),
            createElement('div', ['z-indent', 'z-padtop'], 
                desc => {
                    data.description = data.description.replaceAll('&amp;', '&');
                    let parts = data.description.split(/<\/?b>/);
                    for (let i = 0; i < parts.length; i++) {
                        if (i % 2 === 0) {
                            desc.appendChild(document.createTextNode(parts[i]));
                        } else {
                            desc.appendChild(createElement('b', null, parts[i]));
                        }
                    }
                },
                createElement('div', ['z-padtop2', 'xgray'],
                    !data.xfandom ? data.fandom : `Crossover - ${data.fandom} & ${data.xfandom}`,
                    ` - Rated: ${data.rating}`,
                    ` - ${data.language}`,
                    data.genreA != null && ` - ${data.genreA}`,
                    data.genreB != null && `/${data.genreB}`,
                    ` - Chapters: ${niceNumber(data.chapters)}`,
                    ` - Words: ${niceNumber(data.words)}`,
                    data.reviews > 0 && ` - Reviews: ${niceNumber(data.reviews)}`,
                    data.favs > 0 && ` - Favs: ${niceNumber(data.favs)}`,
                    data.follows > 0 && ` - Follows: ${niceNumber(data.follows)}`,
                    data.updated > 0 && ' - Updated: ',
                    data.updated > 0 && createElement('span', null, up => up.setAttribute('data-xutime', data.updated), unixToReadable(data.updated)),
                    ' - Published: ',
                    createElement('span', null, up => up.setAttribute('data-xutime', data.published), unixToReadable(data.published)),
                    (data.pairings.length > 0 || data.characters.length > 0) && ' - ',
                    data.pairings.length > 0 && data.pairings.map(pair => `[${pair.join(', ')}]`).join(' '),
                    ' ',
                    data.characters.length > 0 && data.characters.join(', '),
                    Boolean(data.completed) && ' - Complete'
                )
            )
        )
    );
}

/**
 * Create the Overlay Element for the given settings
 * @param {object} settings 
 * @returns  {HTMLDivElement}
 */
function createOverlay(settings) {
    return createElement('div', ['table-bordered', 'bff-overlay'], 
        o => o.id = 'betterff-overlay',
        o => !settings.overlayOpen && o.classList.add('closed'),
        createElement('button', ['btn', 'betterff-overlay-btn'], 
            searchButton => searchButton.id = 'betterff-settings-button',
            searchButton => searchButton.style = 'position: absolute; transform: translateX(-100%);',
            '!'
        ),
        createElement('button', ['btn', 'betterff-overlay-btn'], 
            searchButton => searchButton.id = 'betterff-search-button',
            searchButton => searchButton.style = 'position: absolute; transform: translateX(-100%); top: 40px;',
            '?'
        ),
        createElement('form', null, 
            form => form.id = 'betterff-settings-form',
            form => form.action = 'javascript:;',
            createElement('div', 'tcat', 
                header => header.style = 'background-color: transparent !important',
                createElement('span', null,
                    createElement('b', null, 'Settings')
                )
            ),
            createElement('table', ['table', 'table-bordered'], 
                createElement('tbody', null, 
                    createSettingsRow('Backend Url', 'backendUrl', 'text', settings.backendUrl),
                    createSettingsRow('Autoload', 'autoLoad', 'checkbox', settings.autoLoad),
                    createSettingsRow('Darkmode', 'darkMode', 'checkbox', settings.darkMode),
                    createSettingsRow('Tag Groups', 'tagGroups', 'textarea', settings.tagGroups.join(', '))
                )
            ),
            createElement('button', 'btn',
                btn => btn.type = 'submit',
                'Save'
            )
        )
    );
}

/**
 * Creates a HTMLTableRowElement based on the settings given
 * @param {string} text 
 * @param {string} name 
 * @param {string} type 
 * @param {any} value 
 * @returns 
 */
function createSettingsRow(text, name, type, value) {
    return createElement('tr', null, 
        createElement('td', null, 
            td => td.style = 'border-left: none;',
            text
        ),
        createElement('td', null, 
            createElement(type === 'textarea' ? 'textarea' : 'input', null, 
                el => el.id = `bff-backend-${name}`,
                el => el.classList.toggle('span3', type === 'text'),
                el => el.title = text,
                el => el.type = type,
                el => el.name = name,
                el => {
                    if (type === 'checkbox') {
                        el.checked = value;
                    } else {
                        el.value = value;
                    }
                }
            )
        )
    );
}

/**
 * Creates the InnerHTML for the Pagination component
 * @param {number} total Total amount of found stories
 * @param {number} limit Max amount displayed on one page
 * @param {number} page Current page
 * @returns {HTMLSpanElement}
 */
function createPagination(total, limit, page) {
    const maxPages = Math.ceil(total / limit);

    return createElement('span', null, 
        `${niceNumber(total, true)} | `,
        page >= 2 && [createPaginationLink(page -1, '« Prev')],
        ' Page ',
        page >= 2 && createPaginationLink(1),
        ' ',
        page >= 3 && '.. ',
        page >= 12 && createPaginationLink(page - 10),
        ' ',
        span => {
            for (let i = page - 3; i <= page + 3; i++) {
                if (i >= 2 && i !== page && i < maxPages) {
                    span.appendChild(createPaginationLink(i));
                    span.appendChild(document.createTextNode(' '));
                }
                if (i === page) {
                    let bEl = document.createElement('b');
                    bEl.textContent = `${page} `;
                    span.appendChild(bEl);
                }

                if (i === maxPages && i - 1 === page) {
                    span.appendChild(createPaginationLink(i));
                    span.appendChild(document.createTextNode(' '));
                }
            }
        },
        page < (maxPages - 10) && createPaginationLink(page + 10),
        ' ',
        page < maxPages - 1 && '.. ',
        page < maxPages - 1 && createPaginationLink(maxPages, 'Last'),
        ' ',
        page < maxPages && createPaginationLink(page + 1, 'Next »')
    );
}

/**
 * Creates a link element that points to a page
 * @param {number} page Current page
 * @param {string} text 
 * @returns {HTMLAnchorElement}
 */
function createPaginationLink(page, text) {
    return createElement('a', null, 
        el => el.onclick = () => {
            document.getElementById('bff-page').value = page;
            document.getElementById('bff-search-button-hidden').click();
        },
        (text ?? page).toString()
    );
}