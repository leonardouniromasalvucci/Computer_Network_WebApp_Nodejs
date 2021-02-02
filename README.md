# Progetto reti di calcolatori 2017

The in project was developed in [nodejs](https://nodejs.org/it/) and aims to show how a system can use the API of the most well-known systems using [Oauth](https://en.wikipedia.org/wiki/OAuth).

### Oauth

OAuth, is an open communication protocol through which an application (or a web service) can manage secure authorized access to sensitive data. Unlike the Client / Server protocol, the OAuth protocol, as we have seen, does not oblige the user to provide the access credentials to the provider (the external system). The user is redirected to the server of the service provider for system authentication.

### Facebook API
                                                                                                                                                                   
When a user connects to an application and logs in via Facebook, the application gets a token
access that allows temporary and secure access to the Facebook API, that is, allows the application to access
temporarily to the data of that specific user.
An access token is a string that identifies a user, app or page and can be used by the application for
call API Graph, also including information about its expiration and the app that generated it.
As mentioned, calls to the API Graph require the user's prior authorization to access their data
personal, accepted by the latter during login, highlighting the purpose (scopes) of that token, nothing more than a
declaration of what information you want the application to manipulate.
Without going further, let's see in detail the bees mentioned in my application:

1) Calling the “Login” dialog box and setting the redirect URL
                                                                                                   
To show the Login dialog, the application must perform a redirect to an endpoint:

https://www.facebook.com/v2.10/dialog/oauth?client_id=xxx&scope=email,user_birthday&response_type=code&redirect_uri=http://172.17.0.2:3000/accedi_fb

Client_id of the application that requires the access token for the user who is logging in.
Scope, a comma separated list of permissions to be requested from app users.
Response type determines whether the redirect response data to the app is parameters or URL fragments, in our
case "code": the response data is URL parameters containing the code parameter (a different encrypted string for
any request for access). It is useful for server management of the token. Redirect_uri - The URL you want to redirect the user to upon login, which captures the response from the Login dialog.


2) Manage the responses of the Login dialog box

At this point in the login flow, the user will see the Login dialog box and can choose whether to grant or
less data access to the app. Choosing Ok in the Login dialog will grant access to the public profile and a
all permissions required by the app. In any case, the browser will return to the application, which will receive data indicating
if the user has canceled or logged in, if so, the code required for will be added to the redirect
receive the access token. As mentioned, once the code has been acquired, the application makes a new call to a
another server to receive the user's access token by entering the code and other data that we can see from the source.

3) Access to user information, once the token is obtained

Next we make a new request, for example, the call to the following Graph API which uses the access token
for the user:

https://graph.facebook.com/me?fields=id,name,birthday,email&access_token=xxx

returns only the ID, name, date of birth and email of the profile in question.
We access some data of the Public_profile (default), which provides access to a subset of elements that
are part of a user's public profile, including the user's identification code with their name and surname.

Birthday: The date and month of a user's birthday. The year of birth may or may not be included, depending on
of the privacy settings and the access token used to request this field.
Email: Provides access to a user's primary email address via the email property in the user object.

The body field of the responses contains a JSON object with an encoded string:
{id: '2011025755785076', name: 'Leonardo Salvucci', birthday: '02 / 12/1994 ', email:' leonardosalvucci@yahoo.it '}


### Google Drive API

The main process is similar to the one treated for Facebook, carrying out step-by-step authentication, summarizing:
The authorization sequence begins when the application redirects a browser to a Google URL; the URL includes
query parameters indicating the type of access required. Google manages user authentication, selection
of the session and the user's consent. The result is an authorization code, which the application can mistake for
an access token and a refresh token.

The application must store the refresh token for future use and use the access token to log in
a Google API. Once the access token has expired, the application uses the refresh token to obtain it
a new one.

1) I make a call to access the dialog box for the user to log in and possibly
agree to give their information, specified by the scope, to the application making the call, which
is characterized by an identification code:

https://accounts.google.com/o/oauth2/auth?client_id=xxx&response_type=code&redirect_uri=xxx&scope=https://www.googleapis.com/auth/drive

Client_id of the application that requires the access token for the user who is logging in.
Scope, authorization to be requested from those who use the app, specifying that they want to access the user's google drive.
Response type determines the redirect response data to the app.
Redirect_uri - the URL you want to redirect the user to upon login, which captures the window response
Log in dialog box.

2) Manage the responses of the Login dialog box

I receive from the redirect the data of the operation, if successful (the user has accepted the conditions)

https://www.googleapis.com:443/oauth2/v4/tokenc?ode=code&client_id=xxx&client_secret=xxx&redirect_uri=redirect_url&grant_type=authorization_code

3) Access to user information, once the token is obtained

Once the access token has been received, you can proceed to request the information of the user in question:

https://www.googleapis.com/drive/v2/files?maxResults=15&access_token=xxx

In this case, we access the user's files by limiting the number of files in the request for ease of management
(in this case 15), using the API v3, which unlike v2, by default provides for the return of much less
information (in my case useless), for the benefit of a lighter answer.
