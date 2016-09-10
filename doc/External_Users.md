# External Users

## Introduction

Cocorico provides authentication mechanisms such as Facebook,
Google+ or FranceConnect using the [passport](http://passportjs.org/) library.
But when integrating in a 3rd party application, one might want to use its
own user database for authentication and authorization.

This is made possible using a dedicated [JWT](https://jwt.io) (JSON Web Token) authentication
scheme coupled with a per-user authorization declaration.

## Authentication

### Building the JWT of your user

#### Payload

A user is described by a JWT payload containing the following fields:

* `iss`: Your app ID.
* `sub`: The **unique** identifier or the user.
* `firstName`: The firstname of the user.
* `lastName`: The lastname of the user.
* `birthdate`: The birthdate of the user.
* `email`: The e-mail of the user.

**ATTENTION: the `sub` field must be unique for your app!** Otherwise,
ballots of different users will be mixed up. Cocorico will make sure that
`sub` coming from multiple apps will not collide. But it is each app's
responsibility to provide a unique value for the `sub` field of each of its
users.

Example:

```json
{
  "iss": "57cc264630b65c1e04acc09a",
  "sub": "1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "birthdate": "1987-04-11",
  "email": "john.doe@gmail.com",
}
```

#### Signing & encoding

The JWT must be signed and encoded using the secret key of your app:

```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  "your-app-secret"
)
```

### Embedded content

To authenticate a user on embedded content such as the vote widget
(`/embed/vote-widget/:voteId`) or the vote button (`/embed/vote-button/:voteId`),
you must add the following query parameters:

* `appId`: Your app ID.
* `user`: The encoded JWT token of the user.

Example:

```
https://cocorico.cc/embed/vote-button/57cc487608875ef57ac75ff1/?appId=57cc264630b65c1e04acc09a&user=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ
```

The Cocorico client will take care of passing those values to the following API calls made by the embedded content.

### API calls

To authenticate API calls for a specific user, you must add the following HTTP headers:

* `Authorization` The user's encoded JWT prefixed with 'JWT '.
* `Cocorico-App-Id` Your app ID.

Example:

```
Authorization JWT eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ
Cocorico-App-Id 57cc264630b65c1e04acc09a
```

## Authorization

Without any further declaration, **3rd party users are only allowed to participate
to the votes that have been created by the corresponding app** (ie the app
specified by the `iss` field).

You can specify what votes a specific user can participate to by declaring the
`authorizedVotes` field:

```json
{
  "iss": "57cc264630b65c1e04acc09a",
  "sub": "1234567890",
  "firstName": "John",
  "lastName": "Doe",
  "birthdate": "1987-04-11",
  "email": "john.doe@gmail.com",
  "authorizedVotes": [
    "57cc487608875ef57ac75ff1"
  ]
}
```

The `authorizedVotes` field must be an array of the IDs of all the votes the
user can participate to. If the `authorizedVotes` field is missing or the array
is empty, default authorization applies.
