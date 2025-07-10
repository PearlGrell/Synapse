<div align="start">

  <h1 align="start">Synapse</h1>

  <p align="start">
    An intelligent engine to distill signal from noise. Transform sprawling topics into structured, actionable knowledge.
    <br />
    <a href="#"><strong>Explore the Live Demo »</strong></a>
    <br />
    <br />
    <a href="https://github.com/PearlGrell/synapse/issues">Report Bug</a>
    ·
    <a href="https://github.com/PearlGrell/synapse/issues">Request Feature</a>
  </p>
</div>

<div align="start">

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/PearlGrell/synapse/pulls)

</div>

---

## The Genesis: Taming Information Chaos

We live in an era of unprecedented access to information, yet understanding remains elusive. The modern challenge isn't finding data—it's structuring it. Synapse was born from this challenge. It acts as an intelligent companion for the crucial first step of any knowledge-intensive endeavor: building a solid conceptual framework.

Whether you're a student tackling a new domain, a researcher mapping a field, or a creator planning content, Synapse automates the grueling process of creating a high-level overview. It transforms a single line of intent into a comprehensive, hierarchical blueprint, freeing you to focus on what truly matters: insight and creation.

When done with blueprinting, generate a detailed, well-cited document that serves as a foundation for your project, whether it's an article, book, course, or any other knowledge product.

---

## Key Features

*   🧠 **Intelligent Scaffolding**: Leverages Google's Gemini with a sophisticated meta-prompt to generate a clean, structured conceptual map from a single user prompt.
*   🌐 **Dynamic Visualization & Editing**: Renders blueprints as interactive graphs using React Flow. Users can refine the structure with an intuitive command palette (`⌘+K`) for adding, renaming, deleting, and reorganizing nodes.
*   📚 **Automated Research & Synthesis**: For each terminal node in the blueprint, Synapse performs targeted web searches via the Serper API, scrapes high-quality sources, and uses an AI synthesizer to generate concise paragraphs with embedded Markdown citations.
*   📄 **Professional Export Options**: Exports the visual blueprint or the final, detailed content document as a professionally formatted PDF using Puppeteer, ready for printing or sharing.
*   🔄 **Iterative Development**: The entire process is designed for refinement. Start broad, then drill down, expand concepts, and prune irrelevant branches until the blueprint perfectly matches your vision.

---

## 🏛️ Architecture & Technology Stack

Synapse is built with a modern, full-stack TypeScript architecture, leveraging a serverless backend via Next.js API Routes for maximum scalability and ease of development.

| Category          | Technology                                                                                                  | Description                                                               |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Frontend**      | [**Next.js (React)**](https://nextjs.org/), [**TypeScript**](https://www.typescriptlang.org/)                 | Core application framework and language for type-safety.                  |
| **UI / UX**       | [**React Flow**](https://reactflow.dev/), [**Tailwind CSS**](https://tailwindcss.com/), [**shadcn/ui**](https://ui.shadcn.com/) | Interactive graph visualization, utility-first styling, and UI components. |
| **Backend**       | [**Next.js API Routes**](https://nextjs.org/docs/api-routes/introduction)                                     | Serverless functions for all backend logic.                               |
| **AI & Services** | [**Google Gemini**](https://ai.google.dev/), [**Serper API**](https://serper.dev/)                             | AI model for generation/synthesis and low-latency web search.             |
| **Data Handling** | [@extractus/article-extractor](https://github.com/extractus/article-extractor), [md-2-pdf](md-2-pdf.onrender.com) | Web scraping for content synthesis and server-side PDF generation.        |

---

## 🗺️ Future Roadmap

Synapse is an actively developed project. The future vision is to evolve from a user-directed tool into a proactive, agentic knowledge partner.

### 🤖 Agentic AI Blueprinting
The next-generation of Synapse will feature an AI agent that can:
- **Autonomously Evolve Blueprints**: Given a high-level goal, the agent will proactively research, propose new nodes, identify missing concepts, and restructure the blueprint for optimal clarity.
- **Self-Correction and Validation**: The agent will be able to critique its own output, cross-reference sources, and refine the blueprint based on logical consistency and coverage of the topic.
- **Goal-Oriented Research**: Instead of just processing leaf nodes, the agent will understand the user's end goal (e.g., "write a book," "plan a course") and tailor the research and synthesis process accordingly.

### 🔄 Enhanced Export & Interoperability
Move beyond PDF to a suite of standard formats to ensure Synapse fits into any workflow:
- [ ] **Markdown (`.md`)**: For easy integration with Obsidian, Logseq, and other text-based tools.
- [ ] **Microsoft Word (`.docx`)**: For traditional document editing and collaboration.
- [ ] **JSON / XML**: To export the raw blueprint structure for use in other applications.
- [ ] **PowerPoint (`.pptx`)**: Automatically generate a presentation skeleton from the blueprint structure.

### 🔗 Ecosystem Integration & Version Control
Deepen the connection with the tools our users love:
- [ ] **Native Notion & Obsidian Integration**: Two-way sync capabilities to push and pull blueprint updates directly from your knowledge base.
- [ ] **Git-Based Versioning**: Option to save blueprints to a GitHub repository, enabling true version control, branching, and collaboration on knowledge structures.
- [ ] **Real-time Collaboration**: Allow multiple users to view and edit a blueprint simultaneously, with changes reflected live.

---

## 🚀 Getting Started

Follow these instructions to set up a local development environment.

### Prerequisites

*   **Node.js**: v18.x or newer
*   **npm**, **yarn**, or **pnpm** package manager
*   **Google AI API Key**: Get one from [Google AI Studio](https://makersuite.google.com/)
*   **Serper API Key**: Get one from [Serper.dev](https://serper.dev/)

### Installation

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/PearlGrell/synapse.git
    cd synapse
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env.local` file in the project root and add your API keys:
    ```sh
    # .env.local

    # Get from Google AI Studio: https://makersuite.google.com/
    GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"

    # Get from Serper.dev: https://serper.dev/
    SERPER_KEY="YOUR_SERPER_API_KEY"
    ```

4.  **Run the development server:**
    ```sh
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

To contribute:
1.  **Fork the Project**: Click the 'Fork' button at the top right of this page.
2.  **Create your Feature Branch**:
    ```sh
    git checkout -b feature/AmazingFeature
    ```
3.  **Commit your Changes**:
    ```sh
    git commit -m 'Add some AmazingFeature'
    ```
4.  **Push to the Branch**:
    ```sh
    git push origin feature/AmazingFeature
    ```
5.  **Open a Pull Request**: Go to the 'Pull Requests' tab of your forked repository and open a new PR.

Please ensure your PRs are descriptive and link to any relevant issues.

---

## 📄 License

Distributed under the MIT License. See `LICENSE.md` for more information.

---

## 📧 Contact

Pearl Grell - aryantrivedi.lko@gmail.com

Project Link: [https://github.com/PearlGrell/synapse](https://github.com/PearlGrell/synapse)