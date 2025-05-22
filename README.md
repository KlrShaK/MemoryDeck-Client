# Memory Deck

## Introduction

Memory Deck aims to help elderly individuals and those with memory loss retain valuable information through interactive flashcards. This is the frontend of Memory Deck — a useful tool designed to help users (especially the elderly or those with memory challenges) retain information through interactive decks of flashcards. The app emphasizes simplicity and clarity, enhancing its usability for its target audience.
<br><br>
## Technologies Used

- Next.js (React framework)
- TypeScript
- CSS
- Vercel (for deployment)
<br><br>
## High-Level Components

Here are the core parts of the application:

- [**Decks Home Page**](https://github.com/KlrShaK/MemoryDeck-Client/blob/main/app/decks/page.tsx): Lists all available decks of the logged-in user. Users can view, edit, or delete a deck.
- [**Flashcard Editor**](https://github.com/KlrShaK/MemoryDeck-Client/blob/main/app/decks/%5Bid%5D/page.tsx): Allows users to create or modify flashcards inside a deck.
- [**Add Deck & Flashcard Forms**](https://github.com/KlrShaK/MemoryDeck-Client/blob/main/app/decks/%5Bid%5D/edit/flashcards/page.tsx): Simple forms for adding new revision content.
- **AI Flashcard Generator**: AI-powered, quick and easy deck generation functionality based on the topic and prompt provided.
- [**Single-Player Quiz Page**](https://github.com/KlrShaK/MemoryDeck-Client/blob/main/app/decks/solo-quiz/play/%5Bid%5D/page.tsx): Single-player quiz mode to self-test with a time constraint and scoring.
- [**Multi-Player Quiz Page**](https://github.com/KlrShaK/MemoryDeck-Client/blob/main/app/decks/quiz/play/%5Bid%5D/page.tsx): Multi-player quiz mode to self-test and compete live with another user with a time constraint and scoring.
- [**Performance and Statistics**](https://github.com/KlrShaK/MemoryDeck-Client/blob/main/app/statistics/page.tsx): Displays the performance metrics of the user over the past quizzes over the chosen time period.
- [**Support and FAQs**](https://github.com/KlrShaK/MemoryDeck-Client/blob/main/app/tutorials/page.tsx): A tutorial and FAQ page aiming to guide users through the platform and answer all the possible questions.
<br><br>
## Launch & Deployment
To get started with the frontend locally:

### 1. Clone the repository

```
git clone https://github.com/your-username/MemoryDeck-Client.git
cd MemoryDeck-Client
```

### 2. Install dependencies

```
npm install
```

### 3. Run the development server

```
npm run dev
```

### Dependencies:
Make sure the backend API is running locally on http://localhost:8080.

### Deployment
This project is deployed using Vercel.

To deploy:
Push changes to the main branch (Vercel automatically deploys it). The project can be accessed through the URL: [https://sopra-fs25-group-40-client.vercel.app/](https://sopra-fs25-group-40-client.vercel.app/)
<br><br>
## Illustrations and User Flow

Here is a quick and simplified user flow of the app:

Begin by creating an account or logging in from the homepage. Once logged in, the user will end up on the decks homepage where they can access their previously created decks.
<br><br>
<img width="1358" alt="ai" src="https://github.com/user-attachments/assets/83edc58f-ad48-4ad5-907d-afc327a880a4" />
<br><br>
They can start by creating a "memory deck" and adding flashcards manually or using the AI-assisted option for automated and quick deck creation.
<br><br>
<img width="1366" alt="deckdashboard" src="https://github.com/user-attachments/assets/69e1cfd4-47ae-4608-a3f0-f7248d22e34d" />
<br><br>
Manage these decks by editing or deleting cards as needed.
<br><br>
<img width="1369" alt="editdeck" src="https://github.com/user-attachments/assets/66ef08f9-654b-4991-aa51-a90fb4171e9e" />
<br><br>
To review, initiate a quiz by selecting the deck, setting a time limit, and choosing the number of questions. Complete quizzes individually or invite another online user for a multiplayer session. 
<br><br>
<img width="1343" alt="multiquiz" src="https://github.com/user-attachments/assets/e0091db4-9393-4d2c-8a0a-9449eb359947" />
<br><br>
Track your quiz outcomes through performance summaries and detailed statistics provided at the end.
<br><br>
<img width="1355" alt="statsplus" src="https://github.com/user-attachments/assets/b4617087-9664-4551-a23d-f7a7b403e87a" />
<br><br>
Use the available tutorials and FAQ section if further guidance is required.
<br><br>
<img width="1425" alt="Screenshot 2025-05-22 at 19 09 41" src="https://github.com/user-attachments/assets/106ddb3c-ee9a-453c-80b4-e935ba12e5da" />
<br><br>

## Roadmap

Here are some possible features new contributors could add (includes the optional user story we did not implement):
- **Search and Filter Decks**: Implement a search bar or filter tags to allow users to easily find specific decks.
- **Flashcard Enhancements**: Support rich content in flashcards, such as audio clips or formatted text.
- **Scheduled Test Reminders**: Implement a scheduling and automated email reminder system that will notify a user to take their daily test at a previously scheduled reminder time.
<br><br>
## License
This project is licensed under the MIT License. See the [LICENSE](https://choosealicense.com/licenses/mit/) file for details.
<br><br>
## Authors and acknowledgement

This project has come to life thanks to the members of Group 40 of the SoPra module: Melih Serin (melih.serin@uzh.ch), Sarah Nabulsi (sarahosama.nabulsi@uzh.ch), Nicola Luder (nicola.luder@uzh.ch), Shaurya Kishore Panwar (shauryakishore.panwar@uzh.ch), and Leyla Khasiyeva (leyla.khasiyeva@uzh.ch). If you have any questions or comments, you can reach out to us at any of the mentioned email addresses.
<br><br>
## Miscellaneous

This project uses
[`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts)
to automatically optimize and load [Geist](https://vercel.com/font), a new font
family for Vercel.

<br><br>
