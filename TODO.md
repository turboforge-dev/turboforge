## Step-by-Step Instructions and Checklist

- [ ] Star [this repository](https://github.com/react18-tools/turborepo-template/) for easy access and to show your support
- [x] Create a new GitHub repository using this template.
  - Click the `Use this template` button at the top right -> `Create a new repository`
  - Click `Create repository` and wait for the setup workflow to finish rebranding your repo.
- [ ] Install and set up Node.js and your IDE (VSCode recommended)
- [ ] Install the recommended VSCode extensions:
  - [Trello Kanban](https://marketplace.visualstudio.com/items?itemName=mayank1513.trello-kanban-task-board)
- [ ] Install `pnpm` using `npm i -g pnpm`
- [ ] Install dependencies using `pnpm`
  - Run `pnpm i` to install dependencies
- [ ] Make sure you run `pnpm rebrand` from the root directory to rebrand your repo.
- [ ] Run `yarn gen`, and follow prompts to generate new package, or server / client components for your library
- [ ] 🌟 Enable [private vulnerability reporting](https://github.com/react18-tools/turbo-forge/security)
- [ ] Set up `CodeCov`
  - Visit Codecov and set up your repo
  - Create [repository secret]((https://github.com/react18-tools/turbo-forge/settings/secrets/actions)) for `CODECOV_TOKEN`
- [ ] Add `NPM_AUTH_TOKEN` to repository secrets to automate package publishing
  - Log in to your [`npm` account](https://www.npmjs.com/login) and create an automation token
  - Create a new repository or organization secret `NPM_AUTH_TOKEN`
- [ ] Update descriptions in `packages/*/package.json`
- [ ] (Optional) Add Repo Stats by visiting and setting up [repobeats](https://repobeats.axiom.co/)
- [ ] Create your libraries and update examples
- [ ] Update READMEs as required
- [ ] (Optional) Set up [Deepsource](https://app.deepsource.com/login) for static code analysis
- [ ] Push your changes/Create PR and see your library being automatically tested and published
- [ ] Optionally deploy your apps/web to Vercel.
- [ ] Feel free to star this template, contribute, and/or sponsor the [`terbo-forge`](https://github.com/react18-tools/turbo-forge) project or my [other open-source work](https://github.com/sponsors/mayank1513)
- [ ] You can also fork the [`terbo-forge`](https://github.com/react18-tools/turbo-forge/fork) and add your package to `scripts/featured.json`
  - If approved, your package will be automatically added to FEATURED.md and also published on the home page of this repo.

## Recommended Repository Settings

Go to [repository settings] and configure the following:

- [ ] Enable Discussions
- [ ] Enable `Always suggest updating pull request branches`
- [ ] Enable `Automatically delete head branches`

<hr />

<p align="center" style="text-align:center">with 💖 by <a href="https://mayank-chaudhari.vercel.app" target="_blank">Mayank Kumar Chaudhari</a></p>
