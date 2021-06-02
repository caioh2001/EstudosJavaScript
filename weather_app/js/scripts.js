
$(function(){
    // *** APIs ***
    // clima, previsão 12 horas e previsão 5 dias: https://developer.accuweather.com/apis
    // pegar coordenadas geográficas pelo nome da cidade: https://docs.mapbox.com/api/
    // pegar coordenadas do IP: http://www.geoplugin.net
    // gerar gráficos em JS: https://www.highcharts.com/demo

    var accuweatherAPIKey = "AmIfUFBl7qw6VfI2bqNmsk34zbS656vA";
    var mapboxToken = "pk.eyJ1IjoiY2Fpb2gyMDAxIiwiYSI6ImNrcGZldHI2aTA1eXQycG42OHo3N2htNnQifQ.pS9ts91t-z7J5n7DZVF-6A";

    var weatherObject = {
        cidade: "",
        estado: "",
        pais: "",
        temperatura: "",
        textoClima: "",
        iconeClima: ""
    };

    function preencherClimaAgora(cidade, estado, pais, temperatura, min, max, textoClima, iconeClima){
        var textoLocal = cidade + ", " + estado + ". " + pais;
        $("#texto_local").text(textoLocal);
        $("#texto_clima").text(textoClima);
        $("#texto_temperatura").html(String(temperatura) + "&deg;");
        $("#icone_clima").css("background-image", "url('" + weatherObject.iconeClima + "')");
    }

    function gerarGrafico(horas, temperaturas){
        Highcharts.chart('hourly_chart', {
            chart: {
              type: 'line'
            },
            title: {
              text: 'Temperatura hora a hora'
            },
            xAxis: {
              categories: horas
            },
            yAxis: {
              title: {
                text: 'Temperatura (°C)'
              }
            },
            plotOptions: {
              line: {
                dataLabels: {
                  enabled: true
                },
                enableMouseTracking: false
              }
            },
            series: [{
                showInLegend: false,
                data: temperaturas
            }]
        });          
    }

    function pegarPrevisaoHoraAHora(localCode){
        $.ajax({
            url: "http://dataservice.accuweather.com/forecasts/v1/hourly/12hour/"+ localCode +"?apikey="+ accuweatherAPIKey +"&language=pt-br&metric=true",
            type: "GET",
            dataType: "json",
            success: function(data){
                console.log("hourly forecast: ", data);

                var horarios = [];
                var temperaturas = [];

                for(var a = 0; a < data.length; a++){
                    var hora = new Date(data[a].DateTime).getHours();
                    horarios.push(String(hora) + "h");

                    temperaturas.push(data[a].Temperature.Value);

                    gerarGrafico(horarios,temperaturas);
                    $(".refresh-loader").fadeOut();
                }
            },
            error: function(){
                console.log("Falha na requisição.");
                gerarErro("Erro ao obter a previsão hora a hora.");
            }
        });
    }

    function preencherPrevisao5Dias(previsoes){
        $("#info_5dias").html("");

        var diasSemana = ["Domingo","Segunda-Feira","Terça-Feira","Quarta-Feira","Quinta-Feira","Sexta-Feira","Sábado"];

        for(var a = 0; a < 5; a ++){
            var dataHoje = new Date(previsoes[a].Date);
            var diaSemana = diasSemana[dataHoje.getDay()];

            var iconNumber = previsoes[a].Day.Icon <= 9 ? "0" + String(previsoes[a].Day.Icon) : String(previsoes[a].Day.Icon);

            iconeClima = "https://developer.accuweather.com/sites/default/files/"+ iconNumber +"-s.png";
            maxima = String(previsoes[a].Temperature.Maximum.Value);
            minima = String(previsoes[a].Temperature.Minimum.Value);

            elementoHTMLDia =   '<div class="day col">';
            elementoHTMLDia +=      '<div class="day_inner">';
            elementoHTMLDia +=          '<div class="dayname">';
            elementoHTMLDia +=              diaSemana;
            elementoHTMLDia +=          '</div>';
            elementoHTMLDia +=          '<div style="background-image: url(\'' + iconeClima + '\')" class="daily_weather_icon"></div>';
            elementoHTMLDia +=          '<div class="max_min_temp">';
            elementoHTMLDia +=              minima + '&deg; / ' + maxima + '&deg;';
            elementoHTMLDia +=          '</div>';
            elementoHTMLDia +=      '</div>';
            elementoHTMLDia +=  '</div>';

            $("#info_5dias").append(elementoHTMLDia);
        }
    }

    function pegarPrevisao5Dias(localCode){   
        $.ajax({
            url: "http://dataservice.accuweather.com/forecasts/v1/daily/5day/" + localCode + "?apikey=" + accuweatherAPIKey + "&language=pt-br&metric=true",
            type: "GET",
            dataType: "json",
            success: function(data){
                console.log("5 day forecast: ", data);

                $("#texto_max_min").html(String(data.DailyForecasts[0].Temperature.Minimum.Value) + "&deg; / " + String(data.DailyForecasts[0].Temperature.Maximum.Value) + "&deg;");
        
                preencherPrevisao5Dias(data.DailyForecasts);
            },
            error: function(){
                console.log("Falha na requisição.");
                gerarErro("Erro ao obter a previsão de 5 dias.");
            }
        });
    }

    function pegarTempoAtual(localCode){
        $.ajax({
            url: "http://dataservice.accuweather.com/currentconditions/v1/" + localCode + "?apikey=" + accuweatherAPIKey + "&language=pt-br",
            type: "GET",
            dataType: "json",
            success: function(data){
                console.log("Current conditions: ", data);

                weatherObject.temperatura = data[0].Temperature.Metric.Value;
                weatherObject.textoClima = data[0].WeatherText;

                var iconNumber = data[0].WeatherIcon <= 9 ? "0" + String(data[0].WeatherIcon) : String(data[0].WeatherIcon);

                weatherObject.iconeClima = 'https://developer.accuweather.com/sites/default/files/'+ iconNumber +'-s.png';

                preencherClimaAgora(weatherObject.cidade, weatherObject.estado, weatherObject.pais, weatherObject.temperatura, weatherObject.min, weatherObject.max, weatherObject.textoClima, weatherObject.iconeClima);
            },
            error: function(){
                console.log("Falha na requisição.");
                gerarErro("Erro ao obter clima atual.");
            }
        });
    }

    function pegarLocalUsuario(lat, long){
        $.ajax({
            url: "http://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=" + accuweatherAPIKey + "&q=" + lat + "%2C" + long + "&language=pt-br",
            type: "GET",
            dataType: "json",
            success: function(data){
                console.log("Geoposition: ", data);

                try{
                    weatherObject.cidade = data.ParentCity.LocalizedName;

                }
                catch{
                    weatherObject.cidade = data.LocalizedName;

                }

                weatherObject.estado = data.AdministrativeArea.LocalizedName;
                weatherObject.pais = data.Country.LocalizedName;

                var codigoLocal = data.Key;
                pegarTempoAtual(codigoLocal);
                pegarPrevisao5Dias(codigoLocal);
                pegarPrevisaoHoraAHora(codigoLocal);
            },
            error: function(){
                console.log("Falha na requisição.");
                gerarErro("Erro no código do local");
            }
        });
    }

    function pegarCoordenadasDaPesquisa(input){
        input = encodeURI(input);
        $.ajax({
            url: "https://api.mapbox.com/geocoding/v5/mapbox.places/"+ input +".json?access_token=" + mapboxToken,
            type: "GET",
            dataType: "json",
            success: function(data){
                console.log("mapbox: ", data);
                try{
                    var long = data.features[0].geometry.coordinates[0];
                    var lat = data.features[0].geometry.coordinates[1];
                    pegarLocalUsuario(lat, long);
                }
                catch{
                    gerarErro("Erro na pesquisa de local.");
                }
            },
            error: function(){
                console.log("Falha na requisição.");
                gerarErro("Erro na pesquisa de local.");
            }
        });
    }

    function pegarCoordenadasDoIP(){
        var latPadrao = -22.981361;
        var longPadrao = -43.223176;

        $.ajax({
            url: "http://www.geoplugin.net/json.gp",
            type: "GET",
            dataType: "json",
            success: function(data){
                if(data.geoplugin_latitude && data.geoplugin_longitude){
                    pegarLocalUsuario(data.geoplugin_latitude, data.geoplugin_longitude);
                }
                else{
                    pegarLocalUsuario(latPadrao, longPadrao);
                }
            },
            error: function(){
                console.log("Falha na requisição.");
                pegarLocalUsuario(latPadrao, longPadrao);
            }
        });
    }

    function gerarErro(mensagem){
        if(!mensagem){
            mensagem = "Erro na solicitação!";
        }

        $(".refresh-loader").hide();
        $("#aviso-erro").text(mensagem);
        $("#aviso-erro").slideDown();
        window.setTimeout(function(){
            $("#aviso-erro").slideUp();
        },4000);

    }

    pegarCoordenadasDoIP();

    $("#search-button").click(function(){
        $(".refresh-loader").show();
        var local = $("input#local").val();
        if(local){
            pegarCoordenadasDaPesquisa(local);
        }
        else{
            window.alert("Local inválido!");
        }
    });

    $("input#local").on('keypress', function(e){
        if(e.which == 13){
            $(".refresh-loader").show();
            var local = $("input#local").val();
            if(local){
                pegarCoordenadasDaPesquisa(local);
            }
            else{
                window.alert("Local inválido!");
            }
        }
    });
});