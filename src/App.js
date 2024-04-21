import { useReducer, useState, useRef } from "react";
import * as mobilenext from "@tensorflow-models/mobilenet";
import * as tf from '@tensorflow/tfjs';

const stateMachine = {
  initial: "initial",
  states: {
    initial: { on: { next: "loadingModel" } },
    loadingModel: { on: { next: "awaitingLoading" } },
    awaitingLoading: { on: { next: "ready" } },
    ready: { on: { next: "classifying" }, showImage: true },
    classifying: { on: { next: "complete" } },
    complete: { on: { next: "awaitingLoading" }, showImage: true }
  }
};

const reducer = (currentState, event) => {
  const nextState = stateMachine.states[currentState]?.on[event];
  return nextState !== undefined ? nextState : currentState;
};

function App() {
  const [model, setModel] = useState(null);
  const [state, dispatch] = useReducer(reducer, stateMachine.initial);
  const inputRed = useRef();
  const [imageUrl, setImageUrl] = useState(null);
  const [results, setResults] = useState([]);
  const imageRef = useRef();

  const LoadModel = async () => {
    dispatch('next');
    const mobilenetModel = await mobilenext.load();
    setModel(mobilenetModel);
    dispatch('next');
  }

  const Identify = async () => {
    dispatch('next');
    const results = await model.classify(imageRef.current);
    setResults(results);
    console.log(results);
    dispatch('next');
  }
  
  const reset = () => {
    dispatch('next');
  }

  const buttonProps = {
    initial: { text: "Load The Model", action: LoadModel },
    loadingModel: { text: "Loading Model ...", action: () => { } },
    awaitingLoading: { text: "Uploading", action: () => { } },
    ready: { text: "Identifying", action: Identify },
    classifying: { text: "Results", action: reset } // Corrected from classifing to classifying
  };

  const HandleUpload = e => {
    const { files } = e.target;
    if (files.length > 0) {
      setImageUrl(URL.createObjectURL(files[0]));
      dispatch('next');
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center flex-col gap-4 overflow-hidden">
      <div className={`"w-full flex justify-center items-center"`}>
        {state === 'awaitingLoading' && (
          <input type="file" accept="images/*" capture="camera" className="ml-52" ref={inputRed} onChange={HandleUpload} />
        )}
      </div>
      <div className="w-full flex justify-center mt-4 h-fit ">
        {buttonProps[state] && (
          <button onClick={buttonProps[state].action} className="text-white text-center flex py-4 px-4 border-white border-2">{buttonProps[state].text}</button>
        )}
      </div>
      {state === 'ready' && (
        <div className="border-2 h-72 w-64 border-white mt-4 flex">
          <img src={imageUrl} className="w-full h-full" alt="images" ref={imageRef} />
        </div>
      )}
      {state === 'complete' && (<div>
        <ul className="border-2 h-fit p w-fit px-4">
          {results.map(({ className, probability }) => (
            <li key={className} className="text-white">{`${className}: %${(probability * 100).toFixed(2)}`}</li>
          ))}
        </ul>
        </div>
      )}
    </div>
  );
}

export default App;
