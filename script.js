function sendGQLQuery(query) {
  return fetch('http://localhost:60000/simple/v1/cjbo0nvfh000901956pz6y6tw', {
    method: 'POST',
    body: JSON.stringify({query: query}),
    headers: {
      'Content-Type': 'application/json'
    }
  }).then((res) => {
    if (res.ok) {
      return res.json();
    } else {
      return res.text();
    }
  });
}

function readQueryParams() {
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  }
  return query_string;
};

function getNextRowToLabel(projectId) {
  const getNextRowToLabelQuery = `
      query {
        Project(id: "${projectId}"){
          datasets(filter:{dataRows_some:{labels_none:{}}},first:1) {
            dataRows(filter:{labels_none:{}}, first:1) {
              id,
              rowData,
              labels {
                id
              }
            }
          }
        }
      }
    `;
  return sendGQLQuery(getNextRowToLabelQuery).then((res) => {


    if (res.errors){
      if (res.errors.some((err) => err.code === 3008)){
        throw new Error('Permission Denied');
      }
      throw new Error(JSON.stringify(res.errors));
    }

    if (!res.Project || !res.Project.datasets[0] || !res.Project.datasets[0].dataRows[0]) {
      console.log('NO more items to label!');
      return {};
    }

    const {id, rowData} = res.Project.datasets[0].dataRows[0];
    return { id, rowData };
  });
}

function submitLabel(projectId, rowId, label) {
  // TODO work on seconds to label
  const labelRowMutation = `
      mutation {
        createLabel(
          label: "${label}",
          secondsToLabel: 5,
          dataRowId: "${rowId}",
          projectId: "${projectId}"
        ) {
          id
        }
      }
    `;
  return sendGQLQuery(labelRowMutation);
}

function submitLabelAndPullNextRowToLabel(projectId){
  let currentItem;
  const fetchNextItem = () => {
    getNextRowToLabel(projectId).then((nextItem) => {
      if (!nextItem){
        document.body.innerHTML = 'Success! No more items to label in this project!';
      }
      document.querySelector('#item-to-label').innerHTML = `<img src="${nextItem.rowData}" style="width: 300px;"></img>`;
      currentItem = nextItem;
    }, (err) => {
      document.body.innerHTML = err;
    });
  };
  fetchNextItem();
  return function setLabel(label){
    submitLabel(projectId, currentItem.id, label).then(fetchNextItem);
  };
}

const queryParams = readQueryParams();
const next = submitLabelAndPullNextRowToLabel(queryParams.projectId);
document.querySelector('#good').addEventListener('click', () => next('good'));
document.querySelector('#bad').addEventListener('click', () => next('bad'));

