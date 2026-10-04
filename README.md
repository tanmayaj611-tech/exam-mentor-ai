# Exam Mentor AI

BUILD A COMPLETE BANKING EXAM AI AGENT

You are an expert AI-agent developer, full-stack developer, UI/UX designer, testing engineer, and deployment engineer.

I want you to help me build a complete production-ready AI agent called:

Banking Exam Coach AI

The agent is designed for students preparing for Indian banking examinations, especially:

IBPS PO

IBPS Clerk

IBPS RRB PO

IBPS RRB Clerk

Similar banking examinations

The final product must be a working AI-agent application that can be tested and deployed.

1. TECHNOLOGY STACK

Use this technology stack unless there is a strong technical reason to change it:

Frontend

Next.js

TypeScript

HTML/CSS

Responsive design

Mobile-first UI

Backend

Python

FastAPI

AI

Use an LLM API through a secure server-side integration.

Do NOT expose API keys in frontend code.

Create a dedicated AI-agent service that handles:

User messages

Prompt/instructions

Conversation context

Tool calls

Study progress

Mistake tracking

Quiz generation

Mock-test evaluation

Database

Use PostgreSQL.

Store:

User profile

Exam target

Study progress

Completed topics

Quiz results

Mock-test results

Mistake records

Revision history

Study sessions

Authentication

Implement secure user authentication.

Deployment

Make the project suitable for deployment using common cloud hosting.

The final project must include:

Environment variables

Production configuration

Database configuration

Error handling

Logging

README

Deployment instructions

2. AGENT DESCRIPTION

Use this as the official product description:

"Banking Exam Coach AI is a personalized AI study coach for IBPS PO, IBPS Clerk, IBPS RRB and similar banking examinations. It teaches Quantitative Aptitude, Reasoning, English, Banking Awareness and General Awareness from basic to advanced level, provides exam-style practice, evaluates answers, tracks mistakes and progress, creates revision plans, conducts mock tests, and adapts difficulty according to the student's performance."

3. TARGET USER

The main user is a banking-exam student who may be a beginner.

The agent must therefore:

Explain concepts simply.

Start from basics.

Gradually increase difficulty.

Avoid unnecessarily complicated language.

Explain mistakes carefully.

Support English and Marathi.

Allow the student to switch languages.

Focus on understanding before speed.

Adapt lessons based on performance.

4. MAIN AI AGENT FEATURES

Build the following modules.

A. Personal AI Tutor

The AI should teach:

Quantitative Aptitude

Number System

Simplification

Approximation

HCF and LCM

Divisibility

Fractions

Decimals

Percentage

Ratio and Proportion

Average

Profit and Loss

Discount

Simple Interest

Compound Interest

Partnership

Mixture and Alligation

Time and Work

Pipes and Cisterns

Time, Speed and Distance

Boats and Streams

Ages

Quadratic Equations

Data Interpretation

Data Sufficiency

Quantity Comparison

Reasoning

Inequality

Syllogism

Coding-Decoding

Blood Relations

Direction Sense

Ranking

Alphanumeric Series

Number Series

Letter Series

Seating Arrangement

Floor Puzzles

Box Puzzles

Scheduling

Input-Output

Data Sufficiency

Logical Reasoning

English

Parts of Speech

Articles

Tenses

Subject-Verb Agreement

Prepositions

Conjunctions

Pronouns

Adjectives

Adverbs

Modals

Active and Passive Voice

Direct and Indirect Speech

Error Detection

Reading Comprehension

Cloze Test

Fillers

Para Jumbles

Phrase Replacement

Vocabulary

Banking Awareness

RBI

Monetary Policy

Repo Rate

Reverse Repo Rate

CRR

SLR

NABARD

SEBI

SIDBI

IRDAI

Banking terminology

Digital banking

UPI

NEFT

RTGS

IMPS

Financial inclusion

Government banking/financial schemes

General Awareness

Provide current and exam-relevant information when reliable current information is available.

5. PERSONALIZED LEARNING SYSTEM

The AI must not teach every user exactly the same way.

Create a learning profile containing:

Target exam

Current level

Strong subjects

Weak subjects

Completed topics

Topics needing revision

Average accuracy

Average speed

Recent mistakes

Mock-test performance

Use this information to personalize future lessons.

6. DIFFICULTY SYSTEM

Use five levels:

LEVEL 1 — Basic

LEVEL 2 — Foundation

LEVEL 3 — IBPS Clerk

LEVEL 4 — IBPS PO

LEVEL 5 — Advanced

Difficulty should automatically adapt.

If the student performs poorly:

Decrease difficulty and explain the concept.

If the student performs consistently well:

Increase difficulty.

Do not increase difficulty simply because the student completed a lesson.

Use actual performance.

7. QUESTION GENERATION

Generate exam-style questions.

Every question must have:

Question

Options where applicable

Difficulty

Topic

Correct answer

Explanation

Optional shortcut

Do not reveal the correct answer before the student submits an answer in test mode.

For numerical questions, verify calculations before displaying the question.

8. ANSWER CHECKING

When the student submits answers:

Check every answer individually.

Display:

Question number Student answer Correct answer Result Explanation

Then calculate:

Total questions

Correct

Incorrect

Unattempted

Accuracy

Score where applicable

Recheck calculations before final scoring.

9. MISTAKE BOOK

Create a permanent mistake-tracking system.

Whenever the student makes a mistake, store:

User ID

Date

Subject

Topic

Question

Student answer

Correct answer

Error type

Explanation

Revision status

Error types can include:

Concept error

Calculation error

Reading error

Formula error

Guessing error

Time-pressure error

Silly mistake

Allow commands:

"Show my mistakes"

"Test me on my mistakes"

"Revise my weak topics"

10. REVISION ENGINE

Create spaced revision.

Suggested schedule:

Day 1 — Learn

Day 2 — Quick revision

Day 4 — Practice

Day 7 — Test

Day 14 — Revision

Prioritize topics where the student has low accuracy.

11. MOCK TEST SYSTEM

Create mock tests for:

IBPS Clerk Prelims

IBPS PO Prelims

IBPS PO Mains

Other banking exams when requested

Before using a specific current exam pattern, verify the latest officially available pattern.

Mock-test features:

Timer

Question navigation

Mark for review

Submit test

Automatic evaluation

Score

Accuracy

Topic-wise analysis

Time analysis

Weak-topic analysis

Mistake report

Never claim that an unofficial question is an actual previous-year question.

Clearly label generated questions as practice questions.

12. DAILY STUDY PLAN

Create a personalized study plan.

The student can enter:

Exam

Exam date if known

Available study hours

Current level

Strong subjects

Weak subjects

Generate:

Daily plan

Weekly plan

Revision schedule

Mock-test schedule

The default plan may use approximately 6 hours per day but must adapt to the student's available time.

13. ENGLISH SPEAKING MODE

Create a separate English-speaking practice mode.

The AI should:

Ask one question at a time.

Allow the student to answer.

Correct grammar.

Give a natural version.

Explain the correction simply.

Gradually increase difficulty.

Example:

Student: "I wake up at 7 o'clock and then I clean my house."

AI:

Correct: "I wake up at 7 o'clock, and then I clean my house."

Natural: "I wake up at 7 o'clock and then clean the house."

Explanation: Use "wake up" for the action of becoming awake.

Support English and Marathi explanations.

14. CURRENT AFFAIRS

When current information is required:

Use a reliable web/search source if available.

Always consider the date.

Do not present old information as current.

Focus on:

RBI

Banking

Economy

Government schemes

Appointments

Awards

Important national events

International events

Sports

Reports and indexes

Create exam-oriented MCQs from current affairs.

15. USER INTERFACE

Create a clean mobile-friendly dashboard.

Main sections:

Dashboard

Study Now

Quant

Reasoning

English

Banking Awareness

Current Affairs

Practice

Mock Tests

Mistake Book

Revision

Progress

Study Plan

Settings

Dashboard should show:

Today's study target

Study time

Current streak

Accuracy

Weak topics

Pending revision

Upcoming mock test

16. LANGUAGE SELECTOR

Add:

English Marathi

The user should be able to switch language at any time.

The AI should not translate everything unnecessarily.

Use Marathi mainly when the student asks for it or needs a simpler explanation.

17. IMPORTANT AI BEHAVIOR

The agent's core teaching loop must be:

CONCEPT ↓ EXAMPLE ↓ PRACTICE ↓ ANSWER ↓ CHECK ↓ EXPLAIN MISTAKE ↓ REVISION ↓ NEXT LEVEL

The objective is not simply to provide answers.

The objective is to improve the student's ability to solve questions independently.

18. SAFETY AND ACCURACY

The AI must:

Never invent exam information.

Verify current exam information when possible.

Distinguish generated practice questions from official questions.

Recheck mathematical calculations.

Clearly state uncertainty when information cannot be verified.

Never expose API keys.

Validate user input.

Handle API failures gracefully.

Prevent duplicate submissions.

Secure user data.

19. DATABASE DESIGN

Create appropriate database tables/models such as:

users profiles subjects topics study_sessions questions quiz_attempts quiz_answers mock_tests mock_attempts mistakes revision_tasks progress conversation_sessions

Create proper relationships and indexes.

20. API DESIGN

Create clean backend APIs for:

Authentication User profile Subjects Topics AI chat Question generation Quiz creation Answer submission Mock tests Mistake book Revision Progress Study plans

Document all APIs.

21. PROJECT STRUCTURE

Create a clean production-ready structure.

Separate:

Frontend

Backend

AI services

Database

Authentication

Components

API routes

Configuration

Tests

Do not put everything into one file.

Use reusable components and functions.

22. ERROR HANDLING

Handle:

Invalid input

Network failure

AI API failure

Database failure

Authentication failure

Timeout

Rate limit

Empty response

Show the user a simple error message and allow retry.

Never expose internal stack traces or secrets to the user.

23. TESTING

Create automated tests for:

Unit tests

Calculations

Score calculation

Accuracy calculation

Difficulty calculation

Progress calculation

API tests

Authentication

Questions

Answers

Mock submission

Mistakes

Progress

AI tests

Check that the AI:

Explains correctly.

Does not reveal answers during tests.

Correctly checks answers.

Tracks mistakes.

Changes difficulty.

Uses Marathi when requested.

Uses English when requested.

End-to-end test

Simulate:

Register → Login → Select IBPS PO → Start Quant → Answer questions → Submit → Check score → Add mistake → Revision → Mock test → Progress report

Fix all critical errors before deployment.

24. DEPLOYMENT

Prepare the project for production.

Use environment variables for:

AI API key Database URL Authentication secrets Other sensitive configuration

Never hard-code secrets.

Create:

.env.example

README.md

Deployment documentation.

The deployment instructions must explain:

Create database.

Configure environment variables.

Install dependencies.

Run migrations.

Build frontend.

Start backend.

Deploy frontend.

Deploy backend.

Connect production database.

Test production application.

Configure domain if required.

25. FINAL DEPLOYMENT CHECKLIST

Before declaring the application live, verify:

[ ] Frontend works

[ ] Backend works

[ ] Database works

[ ] Authentication works

[ ] AI responses work

[ ] Quant calculations are accurate

[ ] Answer checking works

[ ] Mistake book works

[ ] Progress tracking works

[ ] Mock tests work

[ ] Timer works

[ ] Current-affairs search works when enabled

[ ] English speaking mode works

[ ] Marathi mode works

[ ] Mobile UI works

[ ] API keys are secure

[ ] Error handling works

[ ] Automated tests pass

[ ] Production build succeeds

[ ] Deployment succeeds

26. HOW YOU SHOULD WORK WITH ME

Do NOT dump thousands of lines of code at once.

Build the application in stages.

Use this sequence:

PHASE 1 — Requirements

PHASE 2 — Architecture

PHASE 3 — Project setup

PHASE 4 — Database

PHASE 5 — Backend

PHASE 6 — AI agent

PHASE 7 — Frontend

PHASE 8 — Quiz system

PHASE 9 — Mock-test system

PHASE 10 — Mistake and revision system

PHASE 11 — Testing

PHASE 12 — Security

PHASE 13 — Deployment

PHASE 14 — Production testing

PHASE 15 — Go Live

After each phase:

Explain what was created.

Show the relevant files/code.

Tell me how to test it.

Fix errors before moving to the next phase.

27. FIRST ACTION

Start by creating the complete technical architecture and project plan.

Then tell me:

What software/accounts I need

Which programming languages are being used

Which frameworks are being used

Which APIs are required

Which database is required

Estimated project structure

Development steps

Testing steps

Deployment steps

After that, begin PHASE 1.

Do not skip testing.

Do not declare the project complete until the application has passed the required tests and is ready for deployment.

FINAL GOAL

The final result must be a real, usable, mobile-friendly Banking Exam Coach AI application that a student can open, sign in, study with, practice questions, take mock tests, receive explanations, track mistakes, revise weak topics, and monitor preparation progress.

Build it as a production-ready application, not merely a chatbot demo.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/746068bb-fbc1-463b-b7c1-5b508669cf94).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
