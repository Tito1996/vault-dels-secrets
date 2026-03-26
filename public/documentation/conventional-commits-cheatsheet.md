# Conventional Commit Messages

See how [a minor change](#examples) to your commit message style can make a difference.

git commit -m "**[type](#types)**(**[optional scope](#scopes)**): **[description](#description)**"

> [!Note]
> This cheatsheet is based on the specification of [conventional commits](https://www.conventionalcommits.org/)

## Commit Message Formats

### General Commit

**[type](#types)**(**[optional scope](#scopes)**): **[description](#description)**

### Initial Commit

```bash
chore: init
```

### Merge Commit

Merge branch '**branch name**'

`Follows default git merge message`

### Revert Commit

Revert "**reverted commit subject line**"

`Follows default git revert message`

### Types

- Changes relevant to the API or UI:
  - `feat` Commits that add, adjust or remove a new feature to the API or UI
  - `fix` Commits that fix an API or UI bug of a preceded `feat` commit
- `refactor` Commits that rewrite or restructure code without altering API or UI behavior
  - `perf` Commits are special type of `refactor` commits that specifically improve performance
- `style` Commits that address code style (e.g., white-space, formatting, missing semi-colons) and do not affect application behavior
- `test` Commits that add missing tests or correct existing ones
- `docs` Commits that exclusively affect documentation
- `build` Commits that affect build-related components such as build tools, dependencies, project version, ...
- `ops` Commits that affect operational aspects like infrastructure (IaC), deployment scripts, CI/CD pipelines, backups, monitoring, or recovery procedures, ...
- `chore` Commits that represent tasks like initial commit, modifying `.gitignore`, ...

### Scopes

The `scope` provides additional contextual information.

- The scope is an **optional** part
- Allowed scopes vary and are typically defined by the specific project
- **Do not** use issue identifiers as scopes

### Description

The `description` contains a concise description of the change.

- The description is a **mandatory** part
- Use the imperative, present tense: "change" not "changed" nor "changes"
  - Think of `This commit will...` or `This commit should...`
- **Do not** capitalize the first letter
- **Do not** end the description with a period (`.`)

### Versioning

- **If** your next release contains commit with...
  - **Breaking Changes** incremented the **major version**
  - **API relevant changes** (`feat` or `fix`) incremented the **minor version**
- **Else** increment the **patch version**

### Examples

- ```bash
  feat: add email notifications on new direct messages
  ```

- ```bash
  feat(shopping cart): add the amazing button
  ```

- ```bash
  fix(shopping-cart): prevent order an empty shopping cart
  ```

- ```bash
  fix(api): fix wrong calculation of request body checksum
  ```

- ```bash
  perf: decrease memory footprint to determine unique visitors by using HyperLogLog
  ```

- ```bash
  build: update dependencies
  ```

- ```bash
  build(release): bump version to 1.0.0
  ```

- ```bash
  refactor: implement fibonacci number calculation as recursion
  ```

- ```bash
  style: remove empty line
  ```

---

## References

- <https://www.conventionalcommits.org/>
- <https://github.com/angular/angular/blob/master/CONTRIBUTING.md>
- <http://karma-runner.github.io/1.0/dev/git-commit-msg.html>

- <https://github.com/github/platform-samples/tree/master/pre-receive-hooks>  
- <https://github.community/t5/GitHub-Enterprise-Best-Practices/Using-pre-receive-hooks-in-GitHub-Enterprise/ba-p/13863>
