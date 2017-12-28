<!DOCTYPE html>
<html lang="en">

<head>
    <title>Wellcome Musicoin Forum</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
    <link href='https://fonts.googleapis.com/css?family=Ubuntu:400,300' rel='stylesheet' type='text/css'>
    <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.2.1/jquery.min.js"></script>
    <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/bootbox.js/4.4.0/bootbox.min.js"></script>

</head>

<body>

    <div class="container">
        <div class="text-center">
            <h1>Wellcome to Musicoin Forum </h1>
             <blockquote>
                <p>Hello username, Looks like you have not provided or verified your email. 
                Email address is necessary to register in our forum. Please follow the below link to update or verify your email address.</p>
                <footer>Musicoin Dev. Team</footer>
            </blockquote>
            <div>
                <legend>
                </legend>
            </div>
        </div>
    </div>

    <script>
        $(function(){
             bootbox.alert("Hello username, Looks like you have not provided or verified your email. Email address is necessary to register in our forum. Please follow the below link to update or verify your email address.", 
             function() {
                window.location.href = "http://musicoin.org/nav/profile";
            });
        });
    </script>
</body>
</html>