// create an express application object
var express = require('express');
var app = express();

// add module tfjs to index
const tf = require('@tensorflow/tfjs');

// create body-parser object
var body_parser = require('body-parser')
app.use(body_parser.urlencoded({ extended: false }));

//          --- preprocessing dataset ---

// import the iris dataset
const iris = require('./dataset/iris.json');

// read the dataset
// 144 rows x 4 features
const train_data = tf.tensor2d(
    iris.map(item => [
        item.sepal_length, item.sepal_width, item.petal_length, item.petal_width
    ]), [144, 4]
)

// make one-hot encoding the labels
// 144 rows x 3 classes
const output_data = tf.tensor2d(
    iris.map(item => [
        item.species == 'setosa' ? 1:0,
        item.species == 'virginica' ? 1:0,
        item.species == 'versicolor' ? 1:0
    ]), [144, 3]
)

//          --- build neural network architecture ---
// input: 4, hidden: 10, output: 3

const model = tf.sequential();

model.add(tf.layers.dense({
    inputShape: 4, activation: 'sigmoid', units: 10
}));

model.add(tf.layers.dense({
    inputShape: 10, activation: 'softmax', units: 3
}));

model.summary();

// compile the model

model.compile({
    loss: 'categoricalCrossentropy',
    optimizer: tf.train.adam()
});


//            --- training the model ---

async function training(){
    console.log('Training started ...');

    for(let i=0; i<30; i++)
    {
        let res = await model.fit(train_data, output_data, {epochs: 30});
        console.log(`Iteration ${i}: ${res.history.loss[0]}`);
    }

    console.log('Training finished ...');
}

// middleware to manage request/responses

var do_train = async function(request, response, next){
    await training();
    next();
}

//                --- create client ---

// take the root 
const path  = require('path');
const rootDir = path.join(__dirname, './');
console.log(rootDir);

// define the static 
app.use('/static', express.static(path.join(rootDir, 'static')));

app.use(express.static('./templates')).get('/', function(request, response){
    response.sendFile('./index.html');
});

// bind train route, express app and do_train middleware

app.use(do_train).post('/train', function(request, response){
    response.send("1");
});

//          --- predicting using model ---

app.post('/predict', function(request, response){

    // collect test data from request
    var test = tf.tensor2d([
        parseFloat(request.body.sepalLength),
        parseFloat(request.body.sepalWidth),
        parseFloat(request.body.petalLength),
        parseFloat(request.body.petalWidth)
    ], [1, 4]);

    // generate vector of probabilities for predictions
    var output = model.predict(test).array();

    output.then(value => {
        console.log('probabilities of predictions: ');        
        var probabilities = value[0];
        console.log(typeof probabilities);
        console.log(probabilities);

        // take the class with highest probability
        var pred_class = 0;

        for(var i=1; i<3; i++)
        {
            if(probabilities[i]> probabilities[pred_class]){
                pred_class = i;
            }
        }
        
        // return the max probability
        console.log('max probability: ');
        console.log(probabilities[pred_class]);

        answer = 'undetermined';

        switch(pred_class)
        {
            case 0: 
                answer = 'setosa';
                break;
            case 1: 
                answer = 'virginica';
                break;
            case 2:
                answer = 'versicolor';
                break;
        }

        console.log(answer);

        // make response with result
        const result = {
            class_pred: answer,
            prob_pred: 100 * probabilities[pred_class]
        };

        response.send(result);
    });
});

app.listen(3000, () => {
    console.log('server is running in port 3000');
});

