function buildMap(rows) {
  return rows.reduce((accum, { dataIndex }) => {
    accum[dataIndex] = true;
    return accum;
  }, {});
}

function getCollatorComparator() {
  if (!!Intl) {
    const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
    return collator.compare;
  }

  const fallbackComparator = (a, b) => a.localeCompare(b);
  return fallbackComparator;
}

function sortCompare(order) {
  return (a, b) => {
    var aData = a.data === null || typeof a.data === 'undefined' ? '' : a.data;
    var bData = b.data === null || typeof b.data === 'undefined' ? '' : b.data;
    return (
      (typeof aData.localeCompare === 'function' ? aData.localeCompare(bData) : aData - bData) *
      (order === 'asc' ? 1 : -1)
    );
  };
}

function assembleCSV(columns, data, options) {
  const replaceDoubleQuoteInString = columnData =>
    typeof columnData === 'string' ? columnData.replace(/\"/g, '""') : columnData;

  const buildHead = columns => {
    return (
      columns
        .reduce(
          (soFar, column) =>
            column.download
              ? soFar + '"' + replaceDoubleQuoteInString(column.name) + '"' + options.downloadOptions.separator
              : soFar,
          '',
        )
        .slice(0, -1) + '\r\n'
    );
  };
  const CSVHead = buildHead(columns);

  const buildBody = data => {
    return data
      .reduce(
        (soFar, row) =>
          soFar +
          '"' +
          row.data
            .filter((_, index) => columns[index].download)
            .map(columnData => replaceDoubleQuoteInString(columnData))
            .join('"' + options.downloadOptions.separator + '"') +
          '"\r\n',
        '',
      )
      .trim();
  };
  const CSVBody = buildBody(data);

  const csv = options.onDownload
    ? options.onDownload(buildHead, buildBody, columns, data)
    : `${CSVHead}${CSVBody}`.trim();

  const downloadHasBeenAborted = csv === false;
  if (downloadHasBeenAborted) {
    return null;
  }

  return csv;
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });

  /* taken from react-csv */
  if (navigator && navigator.msSaveOrOpenBlob) {
    navigator.msSaveOrOpenBlob(blob, filename);
  } else {
    const dataURI = `data:text/csv;charset=utf-8,${csv}`;

    const URL = window.URL || window.webkitURL;
    const downloadURI = typeof URL.createObjectURL === 'undefined' ? dataURI : URL.createObjectURL(blob);

    let link = document.createElement('a');
    link.setAttribute('href', downloadURI);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

function createCSVDownload(columns, data, options) {
  const csv = assembleCSV(columns, data, options);
  if (csv) {
    downloadCSV(csv, options.downloadOptions.filename);
  }
}

export { buildMap, getCollatorComparator, sortCompare, createCSVDownload, assembleCSV };
