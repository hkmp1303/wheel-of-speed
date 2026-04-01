## wheel-of-speed
A minimal two player word game written in .NET Minimal API and React + Vite.
## Technology stack

    Frontend
        TypeScript
        Node.js
        React + Vite
    Backend
        C# .Net
    Tooling
        Postman (testing)

## Requirements
### **System Requirements**

    Node.js v24.x
    Git
    Developed on MySQL server version 8.0.41 or higher
    Configured connection string

### **Functional Requirements**

Functional Requirements


## 🚀 How to Run

For inital setup
```shell
git clone git@github.com:hkmp1303/wheel-of-speed.git

cd wheel-of-speed

npm install
```
Once setup is complete
```shell
npm run dev
```
## Configuration

Configure the database connection string in backend/db-config.json. For initial setup use backend/db-config.template.json which can be copied, renamed and filled in with the correct values.

## Database Design


The API will be available via HTTP protocal at http://localhost:/api/* after running the application. The correct port number will be displayed in the console output. Port configuration values are stored and can be changed in backend/Properties/launchSettings.json.

Frontend requests with paths that start with http://localhost:/api/* will be forwarded to the backend.
Key Endpoints

A Postman collection for this project can be found at this link. You may need to request permission to view the collection.

## Authentication


## Project Scope

This project is intended for educational purposes. Error handling and security are simplified. In a production environment, the connection string would be moved to configuration files or environment variables.

## Development Process

As part of the Agile development process, the project includes the following artifacts:

- Wireframe illustrating a simplified outline of the planned user interface
- Mockups illustrating the planned graphical user interface

These artifacts were developed in Miro and are available in the docs/agile directory.

### Documentation

  Architecture
  Technical Debt
  Planned Work

## Authors

This project was developed as a group assignment.

- Christian
  - @Meza
- Emmanuel
  - @mannilowman
- Heather
  - @hkmp1303
- Mohamed
  - @MO

README & Documentation authored by: Heather
