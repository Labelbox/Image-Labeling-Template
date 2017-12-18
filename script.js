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


function getNextRowToLabel(projectId) {
    console.log(projectId)
    const getNextRowToLabelQuery = `
      query {
        getNextRowToLabel(projectId:"${projectId}") {
          id,
          rowData,
        }
      }
    `;
    return sendGQLQuery(getNextRowToLabelQuery).then((res) => {
        console.log(res)
        return res.data.getNextRowToLabel;
    });
}

function submitLabel(projectId, rowId, label) {
    // TODO work on seconds to label
    const labelRowMutation = `
      mutation {
        createLabel(
          label: "${label}",
          secondsToLabel:5,
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
    const nextItem = () => {
      getNextRowToLabel(projectId).then((res) => {
          // probably pass this in
          qs('#item-to-label').innerHTML = `<img src="${res.rowData}" style="width: 300px;"></img>`
          currentItem = res;
      });
    }
    nextItem()
    return function setLabel(label){
        submitLabel(projectId, currentItem.id, label).then(nextItem);
    }
}

// TODO put this in query param or someting
const projectId = "cjb8yu3ly684j0130ant66eef";
const next = submitLabelAndPullNextRowToLabel(projectId);

const qs = document.querySelector.bind(document)
qs('#good').addEventListener('click', () => next('good'))
qs('#bad').addEventListener('click', () => next('bad'))

