$('#btnTrain').click(function(){
    $('#btnTrain').prop('disabled', true);    
    $('#btnTrain').empty().append('Training ...');

    $.ajax({
        type: 'POST',
        url: '/train',
        success: function(result){
            console.log(result);
            $('#btnSend').prop('disabled', false);
            $('#btnTrain').empty().append('Trained');
            $('#sepalLength').prop('disabled', false);
            $('#sepalWidth').prop('disabled', false);
            $('#petalLength').prop('disabled', false);
            $('#petalWidth').prop('disabled', false);
        }
    });
});

$('#btnSend').click(function(){
    var sepalLength = $('#sepalLength').val();
    var sepalWidth = $('#sepalWidth').val();
    var petalLength = $('#petalLength').val();
    var petalWidth = $('#petalWidth').val();

    $.ajax({
        type: 'POST',
        url: '/predict',
        data: {
            sepalLength: sepalLength,
            sepalWidth: sepalWidth,
            petalLength: petalLength,
            petalWidth: petalWidth
        },
        success: function(result){
            console.log(result);
            $('#result').empty().append(result.class_pred);
            $('#prob').empty().append(result.prob_pred.toFixed(4) + '%');
        }
    });
});
