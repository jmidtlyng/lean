const grid = {
  init(tableId, wrapperId){
    const tableRef = document.getElementById(tableId),
          wrapperRef = document.getElementById(wrapperId);

    const grid = new gridjs.Grid({ from: tableRef, sort: true }).render(wrapperRef)
    grid.on("ready", (...args) => htmx.process(wrapperRef));
  }
}
