const h = gridjs.h;

const grid = {
  init(tableId, wrapperId){
    const tableRef = document.getElementById(tableId),
          el_wrapper = document.getElementById(wrapperId);

    const grid = new gridjs.Grid({ from: tableRef, sort: {enabled: true} }).render(el_wrapper)
    grid.on("ready", (...args) => htmx.process(el_wrapper));
  }
}

const gridServerSide = {
  init(tableId, wrapperId, entityType){
    const el_table = document.getElementById(tableId),
          el_wrapper = document.getElementById(wrapperId),
          url = "/_json?type=" + entityType;
    const grid = new gridjs.Grid({
      from: el_table,
      server: { url: url,
        then: data => {
          return data.map(row => {
            for (var col in row) {
              row[col] = h('div', {class: "flex"},
                h('span', {
                    "hx-target": "#listResultsQuickview",
                    "hx-swap": "innerHTML",
                    "hx-trigger": "click",
                    "hx-get": ("/components/quickview/_single/"+row.entity)},
                  h('img', {class:"search-results-quickview-icon", src:"/icons/binos.svg"}, null)
                ), h('span', {}, row[col]));
              break;
            }
            return Object.values(row)
          })
        },
        total: data => data[0].results_count
      },
      pagination: {
        limit: 50,
        server: {url: (prev, page, limit) => `${prev}&limit=${limit}&offset=${page * limit}`}
      },
      sort: {
        multiColumn: true,
        server: {
          url: (prev, columns) => {
            if (!columns.length) return prev;

            const el_cols = el_table.getElementsByTagName('th');
            let sorts = [],
                dirs = [];

            for(const col of columns){
              sorts.push( el_cols[col.index].getAttribute("name") );
              dirs.push(col.direction);
            }

            return `${prev}&sort=${sorts}&dir=${dirs}`;
          }
        },
      },
      search: {
        server: { url: (prev, keyword) => `${prev}&search=${keyword}` },
        debounceTimeout: 1000
      },
    });

    grid.render(el_wrapper);
    grid.on("ready", (...args) => {
      htmx.process(el_wrapper);
    });
  }
}

const gridQuickSearch = {
  init(tableId, wrapperId, searchTerm, entityType){
    const el_table = document.getElementById(tableId),
          el_wrapper = document.getElementById(wrapperId),
          url = "/_json?type=" + entityType + "&search=" + searchTerm;
    const grid = new gridjs.Grid({
      from: el_table,
      server: { url: url,
        then: data => {
          return data.map(row => {
            for (var col in row) {
              row[col] = h('div', {class: "flex"},
                h('span', {
                    "hx-target": "#listResultsQuickview",
                    "hx-swap": "innerHTML",
                    "hx-trigger": "click",
                    "hx-get": ("/components/quickview/_single/"+row.entity)},
                  h('img', {class:"search-results-quickview-icon", src:"/icons/binos.svg"}, null)
                ), h('span', {}, row[col]));
              break;
            }
            return Object.values(row)
          })
        },
        total: data => data[0].results_count
      },
      pagination: {
        limit: 50,
        server: {url: (prev, page, limit) => `${prev}&limit=${limit}&offset=${page * limit}`}
      },
      sort: {
        multiColumn: true,
        server: {
          url: (prev, columns) => {
            if (!columns.length) return prev;

            const el_cols = el_table.getElementsByTagName('th');
            let sorts = [],
                dirs = [];

            for(const col of columns){
              sorts.push( el_cols[col.index].getAttribute("name") );
              dirs.push(col.direction);
            }

            return `${prev}&sort=${sorts}&dir=${dirs}`;
          }
        },
      }
    });

    grid.render(el_wrapper);
    grid.on("ready", (...args) => {
      htmx.process(el_wrapper);
    });
  }
}
