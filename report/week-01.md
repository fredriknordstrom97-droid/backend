# Week 01

<!-- Your own reflection on the week, in English, about one A4 page. The points for the week are under "Weekly report"
on the week page in Canvas, and README.md in this folder tells you how to write it. Write your text below this comment;
pictures go in report/img/. -->

## Intro
My name is Fredrik Nordström, I have an engineering degree since before and I have worked a few years but now I am studying various programming courses instead. I am using linux ubuntu on my school-laptop with Vim as an editor. Setting up Node.js was the only part that was completely new for me in the "setting up" section. I have used git before although not very much, so it is good that this course will refresh and build some more git skills. Setting up Node.js was easy, the only small roadblock I can remember was that I had to reinstall curl because the version I had was specific to snap and didn't have all the features I needed, something like that.

## Modules
It is beneficial to store the actual information on the server, which is why the list itself will be on todo.js. The clients don't need all information at all times, so the todo-list is implemented in a way where the client can make requests to the server for specified information. The function that prints tasks does not need to be on the server however, because it rarely makes sense to print something to the server terminal, people rarely look there. 

## Tests
Writing my own tests was also new for me as far as I can remember, it was quite easy with the templates given. Testing function that return values are easier than printing functions because you can directly compare the returned value with the desired values with boolean logic. Maybe there are some smart ways that I am not aware of but for testing a function that prints, I assume that you have to do a few extra steps to make that function actually return the exact same thing that it also prints. I can't see any way around it but maybe there is.

## Curl
The curl request shows status code which is a number that shows whether or not the request was succesful and sometimes includes a bit more info about what happened to the request. It also shows the content type of the request, for example json or plain text. It also shows the exact message sent.

## Errors
For quite a while I had try-catch statements that caught the errors that happened. I think it was during function testing that I realized that it wouldn't work properly if i caught the errors so I had to rewrite some stuff then. Now the code just throws new Error after simple if statements.

## TIL
I don't know if this is a proper TIL but the most basic and important experience from this week is learning to create the most basic form of a server I think.
