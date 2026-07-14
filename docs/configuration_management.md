# Configuration Management for Edu Anki
# Repository
The repository is located at https://github.com/hoangphuc05/edu-anki

## Clone the repository
```
git clone https://github.com/hoangphuc05/edu-anki.git
cd edu-anki
```

# Add new feature
Each feature will be developed on its own branch

## Create new branch
```
git checkout -b feature-branch
```

## Make change, add, commit and push
```
make change to file a.txt
git add a.txt
git commit -m "commit message"
git push -u origin feature-branch
```

## Merge feature to master branch
When the feature is finished and ready to be merge to master,
 a pull request can be created
1. Go to https://github.com/hoangphuc05/edu-anki/pulls
2. Click on "New Pull Request" button
3. Set base branch as "main", compare as "feature-branch"
4. Click on "Create pull request"
5. Set a descriptive title and desciption
6. Click on create pull request

# Automation
## CI
Automated Unit test is run on every push and pull request. The CI pipeline is defined at [ci.yml](../.github/workflows/ci.yml)

## Tags & release
After a pull request is accepted, an automated workflows will run, create a new tag of the current code, increment the patch version by 1 (ex: 1.0.0 -> 1.0.1)

The workflows will also create a release. The release artifact will include a compiled version of the webapp, and a compiled version of the server application

## Code review automation
Every pull request for code review will trigger a workflow that run automated unit test.

If any of the test fail, the pull request will be blocked from merging to master.

