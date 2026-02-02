<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Suma de dos Numeros</title>
</head>
<body>
    
    <h2>Sumar 2 Numeros </h2>
    <form action="/suma" method="POST">
        @csrf
        <label for="num1">Numero 1:</label>
        <input type="number" name="num1" id="num1" required>
        <br><br>

        <label for="num2">Numero 2:</label>
        <input type="number" name="num2" id="num2" required>
        <br><br>

        <button type="submit">Sumar</button>
    </form>
    <br>

    @if(isset($resultado))
        <h3>Resultado de la suma: {{ $resultado }}</h3>
    @endif
    
</body>
</html>