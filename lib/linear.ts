const ENDPOINT = "https://api.linear.app/graphql";

async function gql(key: string, query: string, variables?: Record<string, unknown>) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: key },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Linear API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0]?.message ?? "GraphQL error");
  return json.data;
}

export async function fetchViewer(key: string) {
  const data = await gql(key, "{ viewer { id name email } }");
  return data.viewer as { id: string; name: string; email: string };
}

export async function fetchTeams(key: string) {
  const data = await gql(key, "{ teams { nodes { id name } } }");
  return data.teams.nodes as { id: string; name: string }[];
}

export async function fetchStates(key: string, teamId: string) {
  const data = await gql(
    key,
    `query($id: String!) { team(id: $id) { states { nodes { id name type } } } }`,
    { id: teamId }
  );
  return data.team.states.nodes as { id: string; name: string; type: string }[];
}

export async function createIssue(
  key: string,
  input: { title: string; description: string; teamId: string; stateId: string }
) {
  const data = await gql(
    key,
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url title }
      }
    }`,
    { input }
  );
  if (!data.issueCreate.success) throw new Error("Issue creation failed");
  return data.issueCreate.issue as { id: string; identifier: string; url: string; title: string };
}
