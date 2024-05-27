$(document).ready(async function () {
  const studentAnswers = {};

  // Function to extract parameter value from URL
  const getParameterByName = (name, url) => {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    const regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return "";
    return decodeURIComponent(results[2].replace(/\+/g, " "));
  };

  // Extract the ID from the URL
  const examId = getParameterByName("id");

// Get the token from local storage and decode it
const token = localStorage.getItem("token");

// Verify if the token exists and is valid
if (!token) {
  // Token not found, redirect to login page
  redirectToLogin();
} else {
  try {
    // Decode the token
    const decodedToken = jwt_decode(token);

    // Verify if the token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    if (decodedToken.exp < currentTime) {
      // Token expired, redirect to login page
      redirectToLogin();
    }
  } catch (error) {
    // Token is invalid, redirect to login page
    redirectToLogin();
  }
}

function redirectToLogin() {
  alert("Invalid or expired token. Please login again.");
  window.location.href = "../../Login/login.html"; // Redirect to the login page
}


  const decodedToken = jwt_decode(token);
  const studentId = decodedToken.studentId;

  // Retrieve student data from local storage
  const studentData = JSON.parse(localStorage.getItem("studentData"));
  if (!studentData) {
    alert("No student data found. Please login again.");
    return;
  }

  // Ensure that the name property exists in the studentData object
  if (!studentData.name) {
    alert("Student name not found in the data.");
    return;
  }

  // Display student information including profile picture
  $("#profilePic").attr(
    "src",
    `http://localhost:3000/${studentData.profilePic.replace(/\\/g, "/")}`
  );
  $("#studentName").text(studentData.name);
  $("#registrationNo").text(`Registration No: ${studentData.registrationNo}`);

  // Construct API URL with the extracted ID
  const apiUrl = `http://localhost:3000/api/exam/${examId}/studentId`;

  try {
    const response = await $.ajax({
      url: apiUrl,
      type: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response) {
      // Display the exam name
      $("#examName").text("Exam name :- " + response.title || "");

      if (response.questions) {
        const questionContainer = $("#questionContainer");
        const questionPalette = $(".question-palette");

        response.questions.forEach((question, index) => {
          // Create question HTML
          const questionHtml = `
            <div class="mb-4 border rounded p-4 question" id="question${
              index + 1
            }" data-question-id="${question._id}">
              <div class="flex justify-between items-center mb-2">
                <h2 class="text-xl font-semibold">Question No.${index + 1}</h2>
              </div>
              <p class="mb-4">${question.questionText}</p>
              <div>
                ${question.options
                  .map(
                    (option) => `
                      <label class="block mb-2">
                        <input type="radio" name="answer${index}" value="${option}" class="mr-2"> ${option}
                      </label>
                    `
                  )
                  .join("")}
              </div>
            </div>
          `;
          questionContainer.append(questionHtml);

          // Create palette button
          const paletteButton = `<button class="bg-red-500 text-black rounded p-2 question-button" data-question-id="${
            index + 1
          }">${index + 1}</button>`;
          questionPalette.append(paletteButton);
        });

        // Show the first question by default
        $("#question1").addClass("active");

        // Add click event to palette buttons
        $(".question-button").click(function () {
          const questionId = $(this).data("question-id");
          $(".question").removeClass("active");
          $(`#question${questionId}`).addClass("active");
        });

        // Save answer
        $(".save-answer").click(function () {
          const activeQuestionElement = $(".question.active");
          const activeQuestionId = activeQuestionElement
            .attr("id")
            .replace("question", "");
          const questionMongoId = activeQuestionElement.data("question-id");
          const selectedOption = $(
            `#question${activeQuestionId} input[name="answer${
              activeQuestionId - 1
            }"]:checked`
          ).val();
          if (selectedOption) {
            studentAnswers[questionMongoId] = selectedOption;
            $(`.question-button[data-question-id="${activeQuestionId}"]`)
              .removeClass("bg-red-500 bg-orange-500 bg-blue-500")
              .addClass("bg-green-500");
          }
        });

        // Save and mark for review
        $(".save-later").click(function () {
          const activeQuestionElement = $(".question.active");
          const activeQuestionId = activeQuestionElement
            .attr("id")
            .replace("question", "");
          const questionMongoId = activeQuestionElement.data("question-id");
          const selectedOption = $(
            `#question${activeQuestionId} input[name="answer${
              activeQuestionId - 1
            }"]:checked`
          ).val();

          if (selectedOption) {
            studentAnswers[questionMongoId] = selectedOption;

            // Remove existing classes and add the mark for review class
            $(`.question-button[data-question-id="${activeQuestionId}"]`)
              .removeClass("bg-red-500 bg-green-500 bg-blue-500")
              .addClass("bg-orange-500");
          } else {
            // If no option is selected, remove the answer for the question
            delete studentAnswers[questionMongoId];
          }
        });

        // Mark
        $(".mark").click(function () {
          const activeQuestionId = $(".question.active")
            .attr("id")
            .replace("question", "");

          // Remove existing classes and add the mark class
          $(`.question-button[data-question-id="${activeQuestionId}"]`)
            .removeClass("bg-red-500 bg-green-500 bg-orange-500")
            .addClass("bg-blue-500");
        });

        // Submit answers
        $(".submit-exam").click(async function () {
          const answersPayload = {
            answers: Object.keys(studentAnswers).map((questionId) => ({
              questionId: questionId,
              answer: studentAnswers[questionId],
            })),
          };

          try {
            const submitResponse = await $.ajax({
              url: `http://localhost:3000/api/exam/${examId}/attend`,
              type: "POST",
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
                "Content-Type": "application/json",
              },
              data: JSON.stringify(answersPayload),
            });

            console.log(submitResponse);

            if (submitResponse) {
              // Encode the submit response as a URL parameter
              const encodedSubmitResponse = encodeURIComponent(
                JSON.stringify(submitResponse)
              );

              // Redirect to the result page with the submit response parameter
              window.location.href = `../Exam/Result.html?submitResponse=${encodedSubmitResponse}`;
            } else {
              alert("Failed to submit the exam.");
            }
          } catch (error) {
            console.error("Error submitting exam:", error.message);
            alert("Failed to submit the exam. Please try again.");
          }
        });
      } else {
        console.error("Failed to fetch exam data");
      }
    } else {
      console.error("Failed to fetch exam data");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
});
