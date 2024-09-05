# Let's create a markdown file for the API documentation


# API Documentation

## Endpoints

### POST Requests

1. **Signup** (`POST`):
   - **Endpoint**: `http://localhost:3000/api/signup/`
   - **Request Body** (JSON):
     ```json
     {
       "name": "John Doe",
       "email": "john@example.com",
       "password": "yourpassword"
     }
     ```
   - **Description**: Creates a new user by signing them up.

2. **Login** (`POST`):
   - **Endpoint**: `http://localhost:3000/api/login/`
   - **Request Body** (JSON):
     ```json
     {
       "email": "john@example.com",
       "password": "yourpassword"
     }
     ```
   - **Response**: It will return an access token and a refresh token.
   - **Description**: Logs the user in and issues access and refresh tokens.

3. **Logout** (`POST`):
   - **Endpoint**: `http://localhost:3000/api/logout/`
   - **Request Headers**: You must send the `refreshToken` in cookies.
   - **Description**: Logs the user out by invalidating the refresh token.

4. **Refresh Token** (`POST`):
   - **Endpoint**: `http://localhost:3000/api/token/`
   - **Request**: Send the `refreshToken` in the cookies.
   - **Description**: Generates a new access token using the refresh token.

5. **Create a Todo** (`POST`):
   - **Endpoint**: `http://localhost:3000/api/todos/`
   - **Request Headers**: Requires Authorization header with the `Bearer` access token.
   - **Request Body** (JSON):
     ```json
     {
       "title": "Buy Groceries",
       "description": "Get fruits and vegetables"
     }
     ```
   - **Description**: Creates a new todo.

### GET Requests

1. **Welcome Message** (`GET`):
   - **Endpoint**: `http://localhost:3000/api`
   - **Description**: Returns a "Hello World" message.

2. **Get All Todos** (`GET`):
   - **Endpoint**: `http://localhost:3000/api/todos/`
   - **Request Headers**: Requires Authorization header with the `Bearer` access token.
   - **Description**: Fetches all todos.

"""

# Saving this content to a markdown file
file_path = "/mnt/data/api_documentation.md"
with open(file_path, "w") as file:
    file.write(markdown_content)

file_path
