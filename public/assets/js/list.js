(function () {
  const tableRef = document.getElementById("listRestultsTbl");
  const wrapperRef = document.getElementById("listRestultsTblWrapper");

  const grid = new Grid({
    from: tableRef.current,
  }).render(wrapperRef.current);;
})();
