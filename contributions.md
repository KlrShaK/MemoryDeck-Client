# Contributions

Every member has to complete at least 2 meaningful tasks per week, where a
single development task should have a granularity of 0.5-1 day. The completed
tasks have to be shown in the weekly TA meetings. You have one "Joker" to miss
one weekly TA meeting and another "Joker" to once skip continuous progress over
the remaining weeks of the course. Please note that you cannot make up for
"missed" continuous progress, but you can "work ahead" by completing twice the
amount of work in one week to skip progress on a subsequent week without using
your "Joker". Please communicate your planning **ahead of time**.

Note: If a team member fails to show continuous progress after using their
Joker, they will individually fail the overall course (unless there is a valid
reason).

**You MUST**:

- Have two meaningful contributions per week.

**You CAN**:

- Have more than one commit per contribution.
- Have more than two contributions per week.
- Link issues to contributions descriptions for better traceability.

**You CANNOT**:

- Link the same commit more than once.
- Use a commit authored by another GitHub user.

---
## Contributions Week 1 - 24.03.2025 to 31.03.2025

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **[@melihsrn]** | [31.03.2025]   | [https://github.com/KlrShaK/MemoryDeck-Server/commit/66a3790431edae7d94107590508bc35911685f77] | Due to not being able to commit freely, I committed my whole work in one commit. This week, I started structuring backend of our app by adding Flashcard and Deck entities with their corresponding DTO, mapper, repository files. Additionally, following our UML diagrams, we will combine deck and flashcard APIs under FlashcardService and FlashcardController files. I implemented REST API endpoints for fetching all the decks for user, getting deck by its id, getting public decks, adding a new deck, updating a deck, and deleting a deck. The regarding issues are #12, #16, #17. | It is an important foundation for our backend. We will continue building our backend on top of this structure. |
| **[@nikkiluder]** | Mar 30, 2025 | [https://github.com/KlrShaK/MemoryDeck-Client/commit/9ef539315591f8218a4ad6f84b35b5655a2dace1](https://github.com/KlrShaK/MemoryDeck-Client/commit/9ef539315591f8218a4ad6f84b35b5655a2dace1) | Issue #13, #14: Create flashcard display component with scrolling functionality and implement Click functionality | Implemented the core flashcard grid layout with scrolling functionality to allow users to browse through multiple flashcards |
| **[@nikkiluder]** | Mar 30, 2025 | [https://github.com/KlrShaK/MemoryDeck-Client/commit/ab7a5ebdc991d0b21abacdee2298ddd97a542415](https://github.com/KlrShaK/MemoryDeck-Client/commit/ab7a5ebdc991d0b21abacdee2298ddd97a542415) | Issue #15 Add settings menu with edit and delete options | Enhanced user experience by adding a dropdown menu with options to manage individual flashcards |
| **[sarahnab]** | [March 31, 2025]   | [https://github.com/KlrShaK/MemoryDeck-Server/commit/84e00e5532172d308556149e2dc029fd3b493085] | [include token in UserGetDTO to support auto-login after registration] | [Without this users would not recieve a token after login] |
|                    | [March 31, 2025]   | [https://github.com/KlrShaK/MemoryDeck-Client/commit/468f403edf6e212ca4caab12d1bdf60f35b7633a] | [Front end regitration form] | [Without this form, users would have no place to log in ] |
| **[@leylakhasieva]** | [March 31, 2025]   | [https://github.com/KlrShaK/MemoryDeck-Client/commit/17c5c84da360d20f8ed00cf41e0cf13493d0011e] | [Added and implemented user story 0 for the initial landing page] | [It is i mportant to have a page that is informative and contains login and registration buttons] |
|**[@KlrShak]**| [March 31, 2025]   | [https://github.com/KlrShaK/MemoryDeck-Server/commit/26e1f17ead3fb21b46f75259b41bd0559b4304b8] | Brief description of the task: Develop a logout feature that clears the user session, such as removing authentication tokens from local storage, and redirects users to the login screen Why this contribution is relevant | This ensures session integrity, prevents unauthorized access after logout, and improves the user experience by providing a clear transition between sessions |

---
## Contributions Week 2 - 01.04.2025 to 07.04.2025

| **Student**        | **Date**     | **Link to Commit** | **Description**                                                                                                                                                       | **Relevance**                                                                                                                                                                            |
|--------------------|--------------| ------------------ |-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **[@klrshak]**     | [07.04.2025]       | [https://github.com/KlrShaK/MemoryDeck-Server/commit/19b89d3cdced03d6d2b79d5d010de9468cd20406] | [Develop Backend API integration to send user input to GPT API and process its JSON request and send a response back]                                                 | [Established critical connection between user interface and AI system, enabling core functionality of dynamic flashcard generation based on user input.]                                 |
|                    | [07.04.2025]       | [https://github.com/KlrShaK/MemoryDeck-Server/commit/41e0d5b8bc3dd7d3a3a666c57b0bb262d51dbe78] | [Write ChatGPT service, which Talks with ChatGPT API, merges the "Deck Title", "Deck Category" and the user given prompt into a appropriate prompt to send to chatgpt] | [Created intelligent prompt engineering system that optimizes AI responses by contextualizing user input with proper metadata, significantly improving flashcard quality and relevance.] |
| **[@melihsrn]**    | [04.04.2025] | [https://github.com/KlrShaK/MemoryDeck-Server/commit/49ae3590ebd3ce4b263e06200ba7b18f8d98167e] | [REST API implementations to fetch all flashcards from a deck and one flashcard from a flashcard id]                                                                  | [Because we will need these APIs to fetch and display flashcards of decks in the frontend.]                                                                                              |
|                    | [04.04.2025] | [https://github.com/KlrShaK/MemoryDeck-Server/commit/97e50ceb76c42330d9f809a3a49d35413c63b8ac] | [REST API implementations for updating flashcard content and deleting flashcards]                                                                                     | [Because we will need these APIs to update and delete flashcards of decks in the frontend.]                                                                                              |
|                    | [04.04.2025] | [https://github.com/KlrShaK/MemoryDeck-Server/commit/72692045d93cb69a2f07fb816be905877d0b112c] | [REST API implementation for creating new flashcards]                                                                                                                 | [Because we will need this API to create new flashcards for decks in the frontend.]                                                                                                      |
|                    | [04.04.2025] | [https://github.com/KlrShaK/MemoryDeck-Server/commit/04bc983014769e1a5b4f50bf5bae22e9cbe63730] | [Creating Quiz Entity with its corresponding Repository, DTO object, Mapper, and Status field files]                                                                  | [Started to create entities using our class diagram in order to have them ready while implementing their corresponding controller, service files.]                                       |
|                    | [04.04.2025] | [https://github.com/KlrShaK/MemoryDeck-Server/commit/3c584646f709d276a572a3924644debc387ac7b8] | [Creating Invitation Entity with its corresponding Repository, DTO object, Mapper files]                                                                              | [Started to create entities using our class diagram in order to have them ready while implementing their corresponding controller, service files.]                                       |
|                    | [04.04.2025] | [https://github.com/KlrShaK/MemoryDeck-Server/commit/5ce7050906f0f3da5289dac1e944d29c593f9fb7] | [Creating Score Entity with its corresponding Repository, DTO object, Mapper files]                                                                                   | [Started to create entities using our class diagram in order to have them ready while implementing their corresponding controller, service files.]                                       |
| **[sarahnab]**     | [04.05.2025] | [https://github.com/KlrShaK/MemoryDeck-Client/commit/fbadeb795cf85ffcbf8ce3fb7972ef4425d784f8] | [Front end form for creating flashcard decks]                                                                                                                         | [Without it users would not be able to create flashcards]                                                                                                                                |
|                    | [04.05.2025] | [https://github.com/KlrShaK/MemoryDeck-Client/commit/47fbff2bb833444fa17c4f0431ddac63a4c06785] | [Validation for the form's entries were added]                                                                                                                        | [Without this userrs would create incomplete or invalid decks]                                                                                                                           |
| [@nikkiluder] | [April 7, 2025] | [https://github.com/KlrShaK/MemoryDeck-Client/commit/b7bdb1c433fdf7e23d8dc3c5e41f2bc18033429c] | Connected home page to flashcard editing and creation pages | This fixes subissues #102 and #103 Essential front-end navigation implemented to allow users to access the core flashcard management functionality from the home screen |
| [@nikkiluder] | [April 7, 2025] | [https://github.com/KlrShaK/MemoryDeck-Client/commit/4b8be0cc21c9c7c15d742fc0043d471f4ec6feb4] | Implemented user invitation interface for quiz functionality | This implements subtasks #62, #68, #64, Created the user selection screen page with search bar, user selection, and "Choose Random" option, enhancing the multiplayer quiz experience |
| [@nikkiluder] | [April 7, 2025] | [https://github.com/KlrShaK/MemoryDeck-Client/commit/7c653140c8c08bd68864ac00cf00ceca15b0308e] | [Enhanced user profile management with dropdown menu] | [Implemented dropdown menu with profile settings and logout button in order for the user to edit their profile as they wish and logout of the application, improving user experience with easy access] |
| **[@leylakhasieva]**   | [07.04.2025]  | [https://github.com/KlrShaK/MemoryDeck-Client/commit/19fb2379cec1e0bb8f581ce32113dda0834f885a] | Structural changes regarding the deck creation, editing, and quiz pages.                                   | Organized files and navigation for clarity among team members.                                                                                                 |
| **[@leylakhasieva]**   | [07.04.2025]  | [https://github.com/KlrShaK/MemoryDeck-Client/commit/e3c520acdd3a322136df98d8597411ffd33a15f9] | Initial commits for edit Deck and edit Flashcard pages.                                                   | The edit button on each flashcard must take the user to the relevant page where they can edit existing decks and flashcards.                                 |
| **[@leylakhasieva]**   | [07.04.2025]  | [https://github.com/KlrShaK/MemoryDeck-Client/commit/a245abc78fd04251e2c82b39a56b32f407396342] | The decks homepage is now dynamic, fetching the user's existing decks.                                     | The homepage displays decks and flashcards accessible only to logged-in users.                                                                                 |

---

## Contributions Week 3 - 07.04.2025 to 14.04.2025

| **Student**        | **Date** | **Link to Commit** | **Description**                 | **Relevance**                       |
| ------------------ | -------- | ------------------ | ------------------------------- | ----------------------------------- |
| **[@klrshak]** | [date]   | [Link to Commit 1](https://github.com/KlrShaK/MemoryDeck-Server/commit/f054e2d415b04f52798b9856ca7710e367147a62) | [Write code to parse the response from chatgpt (in json format) to extract the generated flashcard content and forward to flashcard service] | [Developed crucial data transformation layer that processes AI-generated content into structured flashcard format, ensuring consistent and reliable display of educational content to users.] |
|                    | [date]   | [Link to Commit 2](https://github.com/KlrShaK/MemoryDeck-Server/commit/423ae94daffbe32af98bf8c0e42e593aa064b696) | [Store finalized flashcards in the database so they appear in the homepage flashcard decks.] | [Implemented persistent data storage solution that maintains user-generated content across sessions, enhancing user experience by providing immediate access to previously created Decks.] |
| **[@melihsrn]** | [09.04.2025]   | [https://github.com/KlrShaK/MemoryDeck-Server/commit/e8963e27a3a098b60978fa35c57fe35cdc77788e] | [integration of google cloud storage to store images of flashcards] | [This Google API integration is crucial for users to be able to store their memories not only with descriptions, questions but also with images. ] |
|                    | [09.04.2025]   | [https://github.com/KlrShaK/MemoryDeck-Server/commit/f461effc3cd04d53b102ca085e3c52ca29fcd9b2] | [Create REST APIs to get, upload, delete images for the corresponding flashcard entities] | [This Google API integration is crucial for users to be able to store their memories not only with descriptions, questions but also with images.] |
| **[@githubUser3]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |
| **[@githubUser4]** | [date]   | [Link to Commit 1] | [Brief description of the task] | [Why this contribution is relevant] |
|                    | [date]   | [Link to Commit 2] | [Brief description of the task] | [Why this contribution is relevant] |

---

## Contributions Week 4 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 5 - [Begin Date] to [End Date]

_Continue with the same table format as above._

---

## Contributions Week 6 - [Begin Date] to [End Date]

_Continue with the same table format as above._
