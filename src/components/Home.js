import React, { useState } from "react";
import axios from "axios";

const Home = () => {
  const [transcript, setTranscript] = useState("");
  const [summary, setSummary] = useState("");
  const [supportiveDocs, setSupportiveDocs] = useState([]);
  const [qaQuery, setQaQuery] = useState("");
  const [qaResultList, setQaResultList] = useState([]);
  const [loadingAsk, setLoadingAsk] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [transcribeStatus, setTranscribeStatus] = useState("idle");
  const [s2tTime, setS2tTime] = useState(null);
  const [summaryTime, setSummaryTime] = useState(null);

  const uploadAndTranscribe = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedAudioTypes = ["audio/mpeg", "audio/wav"];
    if (!allowedAudioTypes.includes(file.type)) {
      alert("Only mp3 or wav audio files are allowed.");
      e.target.value = null;
      return;
    }
    setTranscribeStatus("uploading");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "metadata",
        JSON.stringify({
          file_name: file.name,
          file_type: "audio",
          user_id: "123456",
        })
      );

      const uploadRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/upload`,
        formData
      );
      const filePath = uploadRes.data.file_path;

      setTranscribeStatus("transcribing");
      const transcribeRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/transcribe`,
        {
          file: filePath,
        }
      );

      setTranscript(transcribeRes.data.data);
      setS2tTime(Math.floor(transcribeRes.data.processing_time));
    } catch (err) {
      console.error(err);
    } finally {
      setTranscribeStatus("idle");
      e.target.value = null;
    }
  };

  const summarizeText = async () => {
    if (!transcript.trim()) {
      alert("Transcript is empty. Please upload and transcribe audio first.");
      return;
    }
    setLoadingSummary(true);
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/summarize/v2`,
        {
          text: transcript,
          supportive_documents: supportiveDocs,
        }
      );
      setSummary(res.data.data.summary);
      setSummaryTime(Math.floor(res.data.processing_time));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  const askQuestion = async () => {
    if (!qaQuery.trim()) {
      alert("Please enter a question before asking.");
      return;
    }
    setLoadingAsk(true);
    setQaResultList((prev) => [...prev, { question: qaQuery, answer: null }]);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/query`, {
        query: qaQuery,
      });
      setQaResultList((prev) => {
        const updated = [...prev];
        updated[updated.length - 1].answer = res.data.result.answer;
        return updated;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAsk(false);
      setQaQuery("");
    }
  };

  const handleSupportiveDocUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ["application/pdf", "image/jpeg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("Only .pdf, .jpg, .jpeg, or .png files are allowed.");
      e.target.value = null;
      return;
    }
    let fileType = "pdf";
    if (file.type.startsWith("image/")) fileType = "image";
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "metadata",
        JSON.stringify({
          file_name: file.name,
          file_type: fileType,
          user_id: "123456",
        })
      );
      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/upload`,
        formData
      );
      setSupportiveDocs((prev) => [...prev, res.data.file_path]);
    } catch (err) {
      console.error(err);
    } finally {
      e.target.value = null;
    }
  };

  const removeSupportiveDoc = (doc) => {
    setSupportiveDocs((prev) => prev.filter((d) => d !== doc));
  };

  const handleRecordClick = () => {
    alert("Recording feature is under development.");
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-md p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-blue-600">ViBE</h1>
        <div className="space-x-2">
          <button className="bg-gray-100 px-4 py-2 rounded hover:bg-gray-200">
            History
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Login
          </button>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 py-6 flex flex-col lg:flex-row gap-6">
        <div className="flex-[2] space-y-6">
          <div className="bg-white p-4 rounded shadow relative">
            {transcribeStatus !== "idle" && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 text-lg font-medium">
                {transcribeStatus === "uploading"
                  ? "Uploading audio..."
                  : "Transcribing..."}
              </div>
            )}
            <h2 className="text-lg font-semibold mb-2">Transcript</h2>
            <div className="flex justify-end items-start gap-2 mb-1">
              <div className="flex flex-col items-center">
                <label className="bg-blue-500 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-600">
                  Upload Audio
                  <input
                    type="file"
                    onChange={uploadAndTranscribe}
                    disabled={transcribeStatus !== "idle"}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-blue-500 mt-1">
                  (.mp3 or .wav)
                </span>
              </div>
              <button
                onClick={handleRecordClick}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 h-fit"
              >
                Record
              </button>
            </div>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={10}
              className="w-full border p-2 rounded resize-y mt-2"
            />
            {s2tTime && (
              <div className="text-sm text-gray-600 mt-1">
                Processing time: {s2tTime}s
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded shadow relative">
            {loadingSummary && (
              <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center z-10 text-lg font-medium">
                Summarizing...
              </div>
            )}
            <h2 className="text-lg font-semibold mb-2">Summary</h2>
            <div className="flex justify-between items-start mb-2">
              <button
                onClick={summarizeText}
                disabled={loadingSummary}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              >
                Summarize
              </button>
              <div className="flex flex-col items-end">
                <label className="bg-gray-300 text-gray-800 px-4 py-2 rounded cursor-pointer hover:bg-gray-400">
                  Upload Docs
                  <input
                    type="file"
                    onChange={handleSupportiveDocUpload}
                    disabled={loadingSummary}
                    className="hidden"
                  />
                </label>
                <span className="text-xs text-blue-500 mt-1">
                  (.pdf, .jpg, .jpeg, .png)
                </span>
              </div>
            </div>
            <div className="min-h-[80px] border border-dashed border-gray-300 rounded p-2">
              {supportiveDocs.length > 0 ? (
                <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
                  {supportiveDocs.map((doc, idx) => (
                    <li key={idx} className="flex justify-between items-center">
                      <span>{doc}</span>
                      <button
                        onClick={() => removeSupportiveDoc(doc)}
                        className="text-red-500 hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  No supportive documents uploaded.
                </p>
              )}
            </div>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={6}
              className="w-full mt-2 border p-2 rounded resize-y"
            />
            {summaryTime && (
              <div className="text-sm text-gray-600 mt-1">
                Processing time: {summaryTime}s
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white p-4 rounded shadow h-fit flex flex-col justify-between">
          <h2 className="text-lg font-semibold mb-2">Ask</h2>

          {/* 问答聊天框 */}
          <div className="flex flex-col gap-3 h-[400px] overflow-y-auto mb-4 border p-3 rounded bg-gray-50">
            {qaResultList.map((pair, idx) => (
              <div key={idx} className="flex flex-col space-y-1">
                {/* 用户问题（右侧气泡） */}
                <div className="flex justify-end">
                  <div className="bg-blue-600 text-white px-3 py-2 rounded max-w-[80%] text-left break-words">
                    {pair.question}
                  </div>
                </div>

                {/* AI 回答 or Thinking 提示（左侧） */}
                <div className="flex justify-start">
                  {pair.answer !== null ? (
                    <div className="bg-gray-100 text-black px-3 py-2 rounded max-w-[80%] text-left break-words">
                      {pair.answer}
                    </div>
                  ) : (
                    <div className="text-sm italic text-gray-400">
                      Thinking...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 提问输入框 */}
          <div className="flex items-center gap-2">
            <textarea
              value={qaQuery}
              onChange={(e) => setQaQuery(e.target.value)}
              rows={2}
              className="w-full border p-2 rounded resize-none"
              placeholder="Type your question..."
            />
            <button
              onClick={askQuestion}
              disabled={loadingAsk}
              className={`px-4 py-2 rounded text-white ${
                loadingAsk
                  ? "bg-purple-300 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
