'use strict';

const _ = require('lodash');
const fs = require('fs');

const EndpointBuilder = require('./endpoint-builder');
const EndpointChecker = require('./endpoint-checker');
const PostDataGenerator = require('./post-data-generator');

const Validator = function(api, target, validateResponse, exportJson) {

    this.api = api;
    this.target = target;
    this.validateResponse = validateResponse;
    this.exportJson = exportJson;

    this.endpointBuilder = new EndpointBuilder();
    this.postDataGenerator = new PostDataGenerator();

    this.endpointChecker = new EndpointChecker();
    this.builderResponse = async() =>  {
        let toReturn = [];
        await this.api.resources().forEach(async(resource, MainIndex) => {

            // Get the URI parameters
            let uriParameters = [];
            for (let uriParamNum = 0; uriParamNum < resource.allUriParameters().length; ++uriParamNum) {
                uriParameters.push(resource.allUriParameters()[uriParamNum]);
            }

            const unparsedUri = this.endpointBuilder.buildUnparsedUri(this.target, resource);
            let endpointToTest = this.endpointBuilder.parseUriWithParameters(unparsedUri, uriParameters);

            resource.methods().forEach((method) => {
                const methodName = method.method();

                let postData = {};
                if (methodName  === 'post') postData = this.postDataGenerator.generate(method);


                //Here to FIX
                let params = [];
                let paramsName = [];
                let nbSamples = 1;
                
                method.queryParameters().forEach((queryParam)=>{
                    let count = queryParam.examples().length;
                    if(nbSamples<count) nbSamples = count;
                })

                method.queryParameters().forEach((queryParam)=>{
                    paramsName.push(queryParam.name());
                    let count = queryParam.examples().length;
                    if( count > 0){
                        if (nbSamples != count) throw endpointToTest+" Not the same amount of samples";
                        let tempArray = [];
                        queryParam.examples().forEach((sample) => {
                            console.log('[DEBUG][EXAMPLES][' + sample.name() + '] ' + sample.value());
                            tempArray.push(sample.value());
                        })
                        params.push(tempArray);
                    }
                               
                    if(queryParam.example() !== null){
                        console.log('[DEBUG][EXAMPLE][' + queryParam.example().name() + '] ' + queryParam.example().value());
                        let tempArray = [];
                        for(let i = 0; i < nbSamples; i++){
                            tempArray.push(queryParam.example().value());
                        }
                        params.push(tempArray);
                    }
                })

                console.log("[DEBUG][PARAMS]"+params[0]);

                for (let index = 0; index < nbSamples; index++) {
                    let tempArray=[];
                    for (let index2 = 0; index2 < method.queryParameters().length ; index2++){
                        tempArray.push(params[index2][index]);
                    }
                    console.log("[DEBUG][PARAM]"+this.endpointBuilder.addQueryParams(endpointToTest,paramsName, tempArray));
                

                let endpointToTestNow = this.endpointBuilder.addQueryParams(endpointToTest, paramsName, tempArray);

                    let apiHeaders = {};
                    if (method.headers().length > 0) apiHeaders = this.endpointBuilder.parseHeaders(method.headers());

                    const expectedResponses = method.responses();

                    this.endpointChecker.check(
                        endpointToTestNow,
                        methodName,
                        apiHeaders,
                        expectedResponses,
                        postData,
                        validateResponse
                    ).then(() => {
                        console.log("RESOLVE")
                        let headers = '';

                        if (Object.keys(apiHeaders).length > 0)
                            headers = ' - headers: ' + JSON.stringify(apiHeaders);
                        let aResult = {endpoint: endpointToTest,
                            method: methodName,
                            result: true
                        }
                        toReturn.push(aResult);
                        console.log('[ToReturn]'+toReturn);
                        console.log('[OK][' + methodName + '] ' + endpointToTestNow + headers);
                        if (!_.isEmpty(postData)) console.log('    With body: ' + JSON.stringify(postData));
                    }).catch(err => {
                        console.log("ERROR")
                        // FIXME: This solution is unstable, a more elegant way to be found
                        // http://stackoverflow.com/questions/30715367/why-can-i-not-throw-inside-a-promise-catch-handler
                        let aResult = {endpoint: endpointToTest,
                            method: methodName,
                            result: false,
                            error: err.message
                        }
                        toReturn.push(aResult);

                        // setTimeout(() => { console.log(err.message); });
                    }).finally(() => {
                        if (this.api.resources().length === MainIndex + 1) {
                            let data = JSON.stringify(toReturn);
                            // NEXT
                            fs.writeFileSync('result.json', data);
                            console.log(data)
                        }

                    })
   
                }
                
            });

        });

       
    }

    this.validate = async() => {
        const result = await this.builderResponse();
    };
};

module.exports = Validator;
