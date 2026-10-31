
const username = "RashmiRathnayaka";
const token = process.env.GH_TOKEN;

const repositories = [
  {
    owner: "RashmiRathnayaka",
    repo: "RashmiRathnayaka",
    name: "GitHub Profile"
  },
  {
    owner: "RashmiRathnayaka",
    repo: "-Pala-Mithura-Smart-Plant-Growing-Guide",
    name: "Pala Mithura"
  },
  {
    owner: "RashmiRathnayaka",
    repo: "employee-saas",
    name: "Employee SaaS"
  },
  {
    owner: "RashmiRathnayaka",
    repo: "Finance_Tracker",
    name: "Finance Tracker"
  },
  {
    owner: "RashmiRathnayaka",
    repo: "Portfolio-Design-Figma",
    name: "Portfolio Design"
  },
  {
    owner: "PradeshiyaSabhaProject",
    repo: "pradeshiya-sabha-staff",
    name: "Pradeshiya Sabha"
  }
];

const since = new Date(
  Date.now() - 30 * 24 * 60 * 60 * 1000
).toISOString();

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28"
};

const escapeXml = (value = "") =>
  String(value).replace(/[<>&"']/g, char => ({
    "<": "&lt;",
    ">": "&gt;",
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;"
  })[char]);

async function getCommits(project) {
  const url = new URL(
    `https://api.github.com/repos/${project.owner}/${project.repo}/commits`
  );

  url.searchParams.set("author", username);
  url.searchParams.set("since", since);
  url.searchParams.set("per_page", "100");

  const response = await fetch(url, { headers });

  if (!response.ok) {
    console.log(
      `Skipping ${project.name}: HTTP ${response.status}`
    );
    return [];
  }

  const commits = await response.json();

  return commits.map(item => ({
    project: project.name,
    repo: project.repo,
    message: item.commit.message.split("\n")[0],
    date: item.commit.author?.date || item.commit.committer?.date,
    url: item.html_url
  })).filter(item => item.date);
}

async function main() {
  if (!token) throw new Error("GH_TOKEN is missing");

  const results = await Promise.all(
    repositories.map(getCommits)
  );

  const allCommits = results
    .flat()
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const counts = repositories.map(project => ({
    ...project,
    count: allCommits.filter(
      commit => commit.repo === project.repo &&
                commit.project === project.name
    ).length
  }));

  const max = Math.max(1, ...counts.map(p => p.count));

  const width = 850;
  const height = 100 + counts.length * 58;

  const bars = counts.map((p, i) => {
    const y = 35 + i * 58;
    const barWidth = p.count / max * 490;

    return `
      <text x="20" y="${y + 5}" fill="#E6EDF3"
        font-size="15">${escapeXml(p.name)}</text>
      <rect x="220" y="${y - 13}" width="490" height="18"
        rx="8" fill="#30363D"/>
      <rect x="220" y="${y - 13}" width="${barWidth}"
        height="18" rx="8" fill="#2EA043"/>
      <text x="730" y="${y + 2}" fill="#E6EDF3"
        font-size="14">${p.count} commits</text>
    `;
  }).join("");

  const graph = `
  <svg xmlns="http://www.w3.org/2000/svg"
    width="${width}" height="${height}"
    viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" rx="12" fill="#0D1117"/>
    <text x="20" y="22" fill="#58A6FF"
      font-size="17" font-weight="bold">
      Project Activity - Last 30 Days
    </text>
    ${bars}
  </svg>`;

  const recent = allCommits.slice(0, 12);

  const listHeight = Math.max(110, 90 + recent.length * 57);

  const rows = recent.map((item, i) => {
    const y = 65 + i * 57;
    const date = new Date(item.date).toISOString().slice(0, 10);

    return `
      <a href="${escapeXml(item.url)}">
        <text x="20" y="${y}" fill="#58A6FF"
          font-size="13">${escapeXml(date)}</text>
        <text x="130" y="${y}" fill="#3FB950"
          font-size="14">${escapeXml(item.project)}</text>
        <text x="130" y="${y + 19}" fill="#C9D1D9"
          font-size="12">${escapeXml(item.message.slice(0, 85))}</text>
      </a>
    `;
  }).join("");

  const activity = `
  <svg xmlns="http://www.w3.org/2000/svg"
    width="850" height="${listHeight}"
    viewBox="0 0 850 ${listHeight}">
    <rect width="100%" height="100%" rx="12" fill="#0D1117"/>
    <text x="20" y="30" fill="#58A6FF"
      font-size="18" font-weight="bold">
      Recent Project Activity
    </text>
    ${rows}
  </svg>`;

  const fs = await import("node:fs/promises");
  await fs.mkdir("assets", { recursive: true });

  await fs.writeFile(
    "assets/project-activity.svg", graph
  );

  await fs.writeFile(
    "assets/recent-project-activity.svg", activity
  );

  console.log("Project activity generated successfully!");
  console.log("Total commits:", allCommits.length);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});

