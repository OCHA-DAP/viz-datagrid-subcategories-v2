const DATA_COMPLETE = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRguxePjzXGhVXDTL6-JuS5Vppx7fKnk-CBheunS_5RGDKV36tOfLHa5RZ94oO2pDCLcdNC8BBisJzT/pub?gid=1171577919&single=true&output=csv';
const PCT_COMPLETE_SUBCATEGORY = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRguxePjzXGhVXDTL6-JuS5Vppx7fKnk-CBheunS_5RGDKV36tOfLHa5RZ94oO2pDCLcdNC8BBisJzT/pub?gid=1944345237&single=true&output=csv';
const PCT_COMPLETE_COUNTRY = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRguxePjzXGhVXDTL6-JuS5Vppx7fKnk-CBheunS_5RGDKV36tOfLHa5RZ94oO2pDCLcdNC8BBisJzT/pub?gid=579688831&single=true&output=csv';

const pctFormat = d3.format('.0%');
let columns, items = [], originalItems = [];
let iconMap, countryMap, sortOrder = 'category', tooltip;

const isMetaCol = col => col === 'subcategory' || col === 'percentComplete';

const statusLabel = {
  'Complete':   'Available & up-to-date',
  'Incomplete': 'Available, not up-to-date',
  'Empty':      'Unavailable',
  'NA':         'Not applicable'
};

function getData() {
  Promise.all([
    d3.csv(DATA_COMPLETE),
    d3.csv(PCT_COMPLETE_SUBCATEGORY),
    d3.csv(PCT_COMPLETE_COUNTRY)
  ]).then(function(d) {
    let data = d[0];
    let pctSubcategoryData = d[1];
    let pctCountryData = d[2];

    iconMap = {
      'Affected People':                    'affected',
      'Climate':                            'climate',
      'Coordination & Context':             'coordination',
      'Food Security, Nutrition & Poverty': 'food',
      'Geography & Infrastructure':         'location',
      'Health & Education':                 'health'
    };

    countryMap = d3.group(data, d => d['Location']);

    columns = Array.from(new Set(data.map(d => d['Location']))).sort();
    columns.unshift('subcategory');
    columns.push('percentComplete');

    const categories = d3.group(data, d=> d['Category']);
    let subcategoryOrder = [];
    categories.forEach(function(cat) {
      let subcats = Array.from(new Set(cat.map(d => d['Subcategory'])));
      subcats.forEach(function(sc) {
        subcategoryOrder.push({category: cat[0]['Category'], subcategory: sc});
      });
    });

    const subcategories = d3.group(data, d => d['Subcategory'], d => d['Location']);
    const pctComplete = d3.group(pctSubcategoryData, d=> d['Subcategory']);
    const pctCountryComplete = d3.group(pctCountryData, d=> d['Location']);

    let pctCountryValues = {subcategory: 'countryPctComplete', percentComplete: null};
    columns.forEach(function(col) {
      const pctCountry = pctCountryComplete.get(col);
      if (pctCountry !== undefined) {
        pctCountryValues[col] = pctCountry[0]['Percentage Data Complete'];
      }
    });

    subcategoryOrder.forEach(function(sc) {
      let subcategory = subcategories.get(sc.subcategory);
      let pct = pctComplete.get(sc.subcategory);
      if (pct !== undefined) {
        let item = {subcategory: sc.subcategory, percentComplete: pct[0]['Percentage Data Complete'], category: sc.category};
        let isNA = true;
        columns.forEach(function(col) {
          let arr = subcategory.get(col);
          if (arr !== undefined) {
            item[col] = arr[0]['Status'];
            if (arr[0]['Status'] !== "Not applicable") {
              isNA = false;
            }
          }
        });
        if (!isNA) items.push(item);
      }
    });

    items.push(pctCountryValues);
    originalItems = [...items];

    createTable();
  });

  initDisplay();
}

function initDisplay() {
  document.getElementById('field-order-by').addEventListener('click', function() {
    document.querySelector('.orderDropdown').classList.add('open');
  });

  document.addEventListener('mouseup', function(e) {
    const sortBtn = document.getElementById('field-order-by');
    if (e.target !== sortBtn && !sortBtn.contains(e.target)) {
      document.querySelector('.orderDropdown').classList.remove('open');
    }
  });

  document.querySelectorAll('.dropdown-menu a').forEach(function(link) {
    link.addEventListener('click', function() {
      document.querySelector('.dropdown-toggle-text').innerHTML = this.innerHTML;
      const val = this.getAttribute('val');
      if (val !== sortOrder) {
        sortOrder = val;
        sortTable();
      }
    });
  });
}

function sortTable() {
  if (sortOrder === 'category') {
    items = [...originalItems];
  } else {
    let pctRow = items.pop();
    items.sort(function(a, b) {
      return sortOrder === 'dsc'
        ? d3.descending(a.percentComplete, b.percentComplete)
        : d3.ascending(a.percentComplete, b.percentComplete);
    });
    items.push(pctRow);
  }

  d3.select('tbody').selectAll('tr')
    .transition()
    .duration(80)
    .style('opacity', 0)
    .end()
    .catch(() => {})
    .then(() => {
      d3.select('tbody').selectAll('*').remove();
      buildRows();
    });
}


function createTable() {
  tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0);

  let table = d3.select('.table-container').append('table');
  table.append('thead').append('tr')
    .selectAll('th')
    .data(columns).enter()
    .append('th')
    .classed('rotate', d => !isMetaCol(d))
    .html(function (d) {
      return isMetaCol(d) ? '' : `<div>${d}</div>`;
    });

  table.append('tbody');
  buildRows();
  document.querySelector('.loader').style.display = 'none';
  notifyHeight();
}

function notifyHeight() {
  requestAnimationFrame(() => {
    window.parent.postMessage({ iframeHeight: document.body.scrollHeight }, '*');
  });
}


function buildRows() {
  let tbody = d3.select('tbody');
  let rows = tbody.selectAll('tr')
    .data(items).enter()
    .append('tr')
      .attr('class', function (d) {
        return d.subcategory;
      });

  rows
      .style('opacity', 0)
      .transition()
      .duration(120)
      .delay(function(d, i) {
        if (i === items.length - 1) return (items.length - 1) * 7;
        return sortOrder === 'asc' ? (items.length - 2 - i) * 7 : i * 7;
      })
      .style('opacity', 1);

  rows.selectAll('td')
    .data(function (d) {
      return columns.map(function (col) {
        let val = (d[col]===undefined) ? 'Empty' : d[col];
        let obj = { name: col, value: val };
        obj['category'] = (d.category===undefined) ? d.subcategory : d.category;
        if (d.subcategory!=='countryPctComplete') {
          obj['subcategory'] = d.subcategory;
        }
        return obj;
      });
    }).enter()
    .append('td')
    .attr('class', function (d) {
      if (d.value==='Not applicable') d.value = 'NA';
      let val = d.category==='countryPctComplete' ? d.value : 'completeness ' + d.value;
      return isMetaCol(d.name) ? d.name : val;
    })
    .html(function (d) {
      let content = '';
      if (d.name==='subcategory') {
        content = d.value + '<div class="icon-container"><img src="assets/icons/'+iconMap[d.category]+'.svg" alt="" aria-hidden="true" width="20" height="20"></div>';
      }
      if (d.name==='percentComplete' || d.category==='countryPctComplete') {
        content = pctFormat(d.value);
      }
      return content;
    })
    .on('mouseover', function(event, d) {
      const row = event.target.parentElement;
      if (!row.classList.contains('countryPctComplete')) row.classList.add('active');

      const colIndex = event.target.cellIndex;
      document.querySelectorAll('thead th')[colIndex]?.classList.add('active');

      let content = '';
      if (d.name === 'subcategory') {
        content = d.category;
      } else if (d.name === 'percentComplete') {
        content = `Available % of ${d.subcategory}: <strong>${pctFormat(d.value)}</strong>`;
      } else if (d.category === 'countryPctComplete') {
        content = `Available % of ${d.name}: <strong>${pctFormat(d.value)}</strong>`;
      } else {
        content = `${d.subcategory} - ${d.name}: ${statusLabel[d.value] || d.value}`;
      }

      const tooltipNode = tooltip.node();
      tooltip.html(content);
      tooltip.transition().duration(200).style('opacity', .9);

      const posEl = d.name === 'subcategory'
        ? (event.target.querySelector('.icon-container') || event.target)
        : event.target;
      const targetRect = posEl.getBoundingClientRect();
      const targetTop = targetRect.top + window.scrollY;
      const targetLeft = targetRect.left + window.scrollX;
      const targetWidth = posEl.offsetWidth;
      const tooltipHeight = tooltipNode.offsetHeight;
      const tooltipWidth = tooltipNode.offsetWidth;
      const isPercentComplete = event.target.className === 'percentComplete';

      tooltip
        .style('top', (targetTop - tooltipHeight) + 'px')
        .style('left', (isPercentComplete
          ? targetLeft + targetWidth - tooltipWidth
          : targetLeft + targetWidth / 2 - tooltipWidth / 2) + 'px')
        .classed('right', isPercentComplete);
    })
    .on('mouseout', function(event, d) {
      event.target.parentElement.classList.remove('active');
      document.querySelectorAll('thead th.active').forEach(th => th.classList.remove('active'));
      tooltip.transition().duration(500).style('opacity', 0);
    });
}

getData();
