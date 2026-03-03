# EZElectronics

EZElectronics (read *EaSy Electronics*) is a full-stack web application designed to support the management of an electronics store and the interaction with customers through a dedicated website.

This repository is developed for **academic purposes** (Software Engineering course project) and includes both the **implementation** and several **course deliverables** (requirements, estimations, prototypes, test reports, coverage artefacts, etc.).

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
  - [Manager](#manager)
  - [Customer](#customer)
  - [Admin](#admin)
- [Repository Structure](#repository-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Run with Docker (recommended)](#run-with-docker-recommended)
  - [Run without Docker (manual)](#run-without-docker-manual)
- [Testing](#testing)
  - [Run server tests via Docker](#run-server-tests-via-docker)
  - [Run server tests locally](#run-server-tests-locally)
- [Documentation (Academic Deliverables)](#documentation-academic-deliverables)
- [Configuration Notes](#configuration-notes)
- [License](#license)

---

## Project Overview

EZElectronics provides:
- **Store managers** with tools to manage products and handle purchases.
- **Customers** with a catalog, shopping experience, purchase history and reviews.
- **Admins** with system-level maintenance operations (e.g., delete/cleanup actions).

The project includes a **React frontend** and a **Node.js/Express backend**, organized under the `code/` directory, plus multiple documents produced during the engineering process.

---

## Features

### Manager
- View and manage available products
- Add/register new products
- Confirm purchases/orders (workflow support)

### Customer
- Browse available products
- Add products to a cart and purchase them
- View purchase history
- Leave reviews for purchased products
- View reviews of products

### Admin
- Check system status / high-level system management
- Manage data through delete operations (maintenance)

> For API-level details, see [`API.md`](./API.md).

---

## Repository Structure

High-level structure:

- `code/`
  - `client/` — React frontend (Create React App)
  - `server/` — Node.js + Express backend (TypeScript)
- `docker-compose.yml` — run client and server together
- `docker-compose.test.yml` — run server test container
- `API.md` — API documentation
- `RequirementsDocumentV1.md`, `RequirementsDocumentV2.md` — requirements documents
- `OfficialRequirementsDocumentV1.md`, `OfficialRequirementsDocumentV2.md` — “official” versions of requirements
- `GUIPrototypeV1.md`, `GUIPrototypeV2.md` — UI prototype documentation
- `EstimationV1.md`, `EstimationV2.md` — estimation documents
- `TestReport.md` — testing report
- `Coverage_WB/`, `Dependency_graphs/` — additional academic artefacts
- `Immagini/`, `images_official/` — images used by documents

---

## Tech Stack

**Frontend**
- React (Create React App)
- TypeScript
- Bootstrap / React-Bootstrap
- React Router

**Backend**
- Node.js + Express (TypeScript)
- Passport (local strategy) for authentication
- SQLite (and also PostgreSQL dependency present)
- Jest + Supertest for tests

**Containerization**
- Docker Compose (client + server)
- Dedicated test Dockerfile for server tests (see `docker-compose.test.yml`)

---

## Getting Started

### Prerequisites

One of the following setups is recommended:

- **Docker + Docker Compose** (recommended for quick start)
- Or:
  - Node.js + npm
  - (Optional) SQLite / PostgreSQL depending on the configured runtime

---

### Run with Docker (recommended)

From the repository root:

```bash
docker compose up --build
