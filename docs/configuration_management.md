# Configuration Management Report — Edu Anki

## 1. Introduction
This report details the configuration management (CM) activities performed on the Edu Anki semester project. It covers version control, branching strategy, change control, release tagging, and the submission of source code.

## 2. Version Control System
- **Tool:** Git, hosted on GitHub.
- **Repository:** https://github.com/hoangphuc05/edu-anki
- **Access:** The instructor has been granted access to the repository to review all source code and history.

## 3. Branching Strategy
All new development is performed on dedicated branches, separate from the master branch.
The master branch is protected and cannot be changed directly without a pull request.

1. Create a feature branch from master:
   ```
   git checkout -b feature-branch
   ```
2. Make changes, then stage, commit, and push:
   ```
   git add .
   git commit -m "descriptive commit message"
   git push -u origin feature-branch
   ```
3. Once the feature is tested and working on the branch, merge it back to master via a pull request:
   - Go to https://github.com/hoangphuc05/edu-anki/pulls
   - Click **New Pull Request**, set base to `main` and compare to `feature-branch`
   - Add a descriptive title and description, then create the pull request.

## 4. Change Control Process
A formal change control process governs all changes introduced into the working baseline.

1. **Request:** A change is proposed and documented (feature, bug fix, or improvement).
2. **Branch:** The change is developed on a new branch off master.
3. **Review:** A pull request is created and reviewed; automated unit tests run on every push and pull request.
4. **Manual testing:** The change is manually tested on the branch to verify it works as intended before merging.
5. **Approval:** The change is merged to master only after tests pass and review is approved.
6. **Baseline:** The merged code becomes the new working baseline.

## 5. Testing
Two levels of testing are performed before a change is merged into the working baseline.

- **Automated testing:** Unit tests run automatically on every push and pull request via CI.
- **Manual testing:** Each feature is manually tested on its branch to confirm functionality, user flows, and edge cases behave correctly before the change is approved for merge.

## 6. Release Tagging
Once a version of the software is completed and tested, it is tagged with a release number.

- After a pull request is accepted, an automated workflow creates a new tag and increments the patch version (e.g., `1.0.0` → `1.0.1`).
- The workflow also creates a release containing compiled versions of the webapp and the server application.

## 7. Automation
- **CI:** Automated unit tests run on every push and pull request (see `.github/workflows/ci.yml`).
- **Release:** Automated tagging and release creation on merge.
- **Code review:** Pull requests trigger automated tests; failing tests block merging to master.

## 8. Source Code Submission
The source code is submitted separately as a zip file, alongside this configuration management report.
