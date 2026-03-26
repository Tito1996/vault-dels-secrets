# Conventional Commit Messages [![starline](https://starlines.qoo.monster/assets/qoomon/5dfcdf8eec66a051ecd85625518cfd13@gist)](https://github.com/qoomon/starline)

See how [a minor change](#examples) to your commit message style can make a difference.

<pre>
git commit -m"<b><a href="#types">&lt;type&gt;</a></b></font>(<b><a href="#scopes">&lt;optional scope&gt;</a></b>): <b><a href="#description">&lt;description&gt;</a></b>" \
</pre>

> [!Note]
> This cheatsheet is opinionated, however it does not violate the specification of [conventional commits](https://www.conventionalcommits.org/)
> [!TIP]
> Take a look at **[git-conventional-commits](https://github.com/qoomon/git-conventional-commits)** ; a CLI util to ensure these conventions, determine version and generate changelogs.

## Commit Message Formats

### General Commit

<pre>
<b><a href="#types">&lt;type&gt;</a></b></font>(<b><a href="#scopes">&lt;optional scope&gt;</a></b>): <b><a href="#description">&lt;description&gt;</a></b>
</pre>

### Initial Commit

```
chore: init
```

### Merge Commit

<pre>
Merge branch '<b>&lt;branch name&gt;</b>'
</pre>
<sup>Follows default git merge message</sup>

### Revert Commit

<pre>
Revert "<b>&lt;reverted commit subject line&gt;</b>"
</pre>
<sup>Follows default git revert message</sup>

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
- In case of breaking changes also see [breaking changes indicator](#breaking-changes-indicator)

### Versioning

- **If** your next release contains commit with...
  - **Breaking Changes** incremented the **major version**
  - **API relevant changes** (`feat` or `fix`) incremented the **minor version**
- **Else** increment the **patch version**

### Examples

- ```
  feat: add email notifications on new direct messages
  ```

- ```
  feat(shopping cart): add the amazing button
  ```

- ```
  fix(shopping-cart): prevent order an empty shopping cart
  ```

- ```
  fix(api): fix wrong calculation of request body checksum
  ```

- ```
  perf: decrease memory footprint for determine unique visitors by using HyperLogLog
  ```

- ```
  build: update dependencies
  ```

- ```
  build(release): bump version to 1.0.0
  ```

- ```
  refactor: implement fibonacci number calculation as recursion
  ```

- ```
  style: remove empty line
  ```

---

## References

- <https://www.conventionalcommits.org/>
- <https://github.com/angular/angular/blob/master/CONTRIBUTING.md>
- <http://karma-runner.github.io/1.0/dev/git-commit-msg.html>

- <https://github.com/github/platform-samples/tree/master/pre-receive-hooks>  
- <https://github.community/t5/GitHub-Enterprise-Best-Practices/Using-pre-receive-hooks-in-GitHub-Enterprise/ba-p/13863>
