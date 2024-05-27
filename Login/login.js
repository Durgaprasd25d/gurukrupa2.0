$(document).ready(function () {
  $("#loginForm").submit(function (event) {
    event.preventDefault();

    const registrationNo = $("#registrationNo").val();
    const password = $("#password").val();

    $.ajax({
      url: "http://localhost:3000/api/students/login",
      type: "POST",
      contentType: "application/json",
      data: JSON.stringify({ registrationNo, password }),
      success: function (data) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("studentData", JSON.stringify(data.student)); // Store student data
        console.log(data.token);
        console.log(data);
        window.location.href = '../Exam/examList.html'; // Redirect to the exam page
      },
      error: function (xhr, status, error) {
        console.error("Login failed:", xhr.responseJSON.message);
      },
    });
  });
});
``