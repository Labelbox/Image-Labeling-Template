function sendGQLQuery(query) {
  return fetch('https://api.graph.cool/simple/v1/cjayy2nck0l130161d8nyt98u', {
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
        getNextRowToLabel(projectId:"${projectId}") {
          id,
          rowData,
        }
      }
    `;
  return sendGQLQuery(getNextRowToLabelQuery).then((res) => {
    if (res.errors){
      throw new Error(JSON.stringify(res.errors));
    }
    return res.data.getNextRowToLabel;
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
      console.log(err);
      document.body.innerHTML = 'An error has occured.';
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

