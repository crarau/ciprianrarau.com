---
title: "Mobile Releases as Code: Two App Stores, One Control Plane"
author: Ciprian Rarau
publishDate: 2026-07-28T16:00:00Z
category: Building
excerpt: "I stood up a full Android release pipeline next to an existing iOS one: builds, rollouts, Slack alerts, store team access, and testers, all driven from git. The stores could not be more different, and that is the interesting part."
substack: true
tags:
  - infrastructure-as-code
  - ci-cd
  - android
  - ios
  - google-play
  - app-store-connect
  - devops-automation
draft: false
metadata:
  featured: false
  showAuthor: true
  showDate: true
  showReadingTime: true
  showTags: true
transcript: |
  I built the Android side of a mobile release pipeline next to the iOS one that already existed. Push to a branch and a signed build lands on the store's testing track. The version number comes from the store itself, the commit list goes to Slack, and who has access to the store console is a YAML file where the pull request shows the plan and the merge applies it. The two stores work completely differently and I wanted everything managed the same way: from git.
---

The QA engineer was testing the wrong app. She had the opt-in link, she had the phone, she was motivated, and the store was serving her a build from before the pipeline existed, while every fresh build sat in a state nobody could receive. Nothing was broken. Every run was green. The gap was invisible until someone typed one sentence in Slack: "while it is draft there is no update of the app to testers."

That sentence is why I like this project as a story. Over a couple of days at a healthcare startup I build with, I stood up the complete Android release pipeline next to an existing iOS one: builds, store uploads, tester rollouts, failure and success alerts, store team access, all of it. The pipeline itself is not the interesting part. The interesting part is that the two app stores disagree about almost everything, and the only way to keep both of them sane is to make git the control plane and treat each store as just another deploy target.

## Push to a branch, get a build on the store

The model is the same on both platforms. Four branches map to environments: two development branches, staging, and main. Push to one and CI builds a signed artifact for that environment's app and uploads it to the store's testing surface: TestFlight on iOS, the Play internal testing track on Android. The commit gets tagged with the build number, and Slack gets a message: version, environment, and the commits since the previous build of that lane, so anyone reading the channel knows exactly what is in the build they are about to test.

One decision I will defend anywhere: the build number comes from the store, not from git. The common trick of using the git commit count as versionCode falls apart the moment you have release branches with fewer commits than the branch that shipped last. The store already maintains the one sequence that matters, the sequence it will accept. So the pipeline reads the highest build number from the store's own track and adds one. Forward-only, by construction, on every branch and every machine.

## Four failures before the first green run

I tested the whole thing on the pull request branch before merging, with a temporary trigger. Four consecutive runs failed, and every failure was a real infrastructure gap that would otherwise have landed on the team after merge:

1. **The store API was disabled.** First run died in three minutes with PERMISSION_DENIED. Enabled it, and codified the enablement in Terraform in the same hour, because an API someone clicked on in a console is an API that gets lost in the next project migration.

2. **The standard runner could not finish the build.** A cold React Native release build blew past the 60 minute job timeout. Fun detail: a job that hits its timeout reports as "cancelled", not "failed", which sends you looking for who cancelled it.

3. **Parallel Gradle killed the runner.** I gave the build more heap and parallel workers to speed it up, and the VM died mid-build with "the hosted runner lost communication with the server". The fix was moving to a larger runner, where the build now takes 18 minutes. But the lesson worth money is the failure mode: a dead runner never reaches your notification step. The build just vanishes. If your alerting assumes the workflow gets to say goodbye, you have a class of silent failures waiting for you.

4. **An upstream bug on the empty track.** The store client library crashed reading a testing track that had never had a release, a known upstream issue. Rescued that one specific error as "empty track, bootstrap the sequence" so a brand new app's first upload works from CI, no console clicking required.

Four runs, four fixes, all of them in the pull request before anyone reviewed it. This is what testing infrastructure means to me: not "the YAML parses", but "the pipeline has already survived contact with production reality before the merge button exists".

## The two stores are opposites, and both are fine

Here is the part that surprised the team, and it will surprise anyone carrying assumptions from one store to the other.

**Apple is asynchronous.** You upload a build and then you wait. Processing takes minutes or hours, and only Apple knows when it is done, so the only honest architecture is a webhook: Apple calls you when the build is ready, and a small cloud function turns that into the Slack message with the commit list. I wrote about that setup separately.

**Google is synchronous.** When the upload step returns, the build is on the track. Done. No webhook exists and none is needed; the workflow itself posts the success message with the commits, because the workflow is the first and only system that knows. Same outcome as iOS, opposite architecture, and the deciding factor is nothing you control: it is how the store's pipeline works.

**Testers are inverted too.** On TestFlight, an internal tester must be a member of your App Store Connect team, so tester management is team management. On Google Play, testers are just email addresses on a list plus a one-time opt-in link, completely decoupled from console access. A person can test every build without having any access to anything. My own team tripped on this within a day, asking how to "onboard devices" when the answer was: click the link, that is the whole thing.

And the draft problem from the opening: uploads were landing as drafts, which the store shows in the console but never delivers. One word in the upload configuration, draft to completed, and every build since rolls out to testers automatically. The store had been green the whole time. Green is not the same as delivered.

## Who has access to the store is a pull request

The piece I care most about is not the build. It is access.

Both stores have a console, and both consoles have a users page where somebody clicks. I have replaced that page with a YAML file in the devops repository. The roster lists people and roles. Open a pull request that changes it and CI posts a read-only plan as a comment: who gets invited, who changes, what would be removed. Merge to main and the plan applies. Removals are never automatic; deleting a person requires a deliberate manual flag, because the failure mode of "the roster tool quietly removed the account owner" is not one I want to discover.

Two details matter for doing this properly. First, the automation runs as a service account, not as me. My personal access can disappear tomorrow and the tooling does not care. Second, the same pattern now covers both stores, so adding a developer to both consoles is one file edit, and the answer to "who has access to what" is git log instead of digging through two admin UIs.

This is the same shape as everything else I run: Slack channels from YAML, Google Workspace from Terraform, Sentry from config. The app stores were the last two surfaces that still lived in a browser tab, and now they do not.

## The guiding principle: the developer just pushes

Strip everything above away and here is what remains. A developer finishes a feature and pushes to a branch. That is the entire job. The system takes it from there: the build, the signing, the version number from the store, the upload, the rollout to testers, the Slack message telling everyone what is in the build and where to get it. Nobody deploys. Nobody remembers steps. Nobody asks whether the build is out, because the channel already said so.

That is the peace of mind I am after when I wire these systems. Not automation for its own sake, but the moment where a release stops being a task anyone thinks about and becomes a side effect of writing code. When it works, it feels almost magical: you push, and a few minutes later the app is on a phone across the team, with the commit list attached. That is the developer experience I want everywhere I build, and it is the standard both app stores are now held to.

Builds, rollouts, alerts, access, testers. If the store touches it, git drives it.
