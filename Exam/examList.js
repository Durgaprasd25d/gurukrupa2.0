$(document).ready(async function () {
  const token = localStorage.getItem('token');
  console.log('token', token);
  
  if (!token) {
    // If no token is found, redirect to the login page
    window.location.href = 'login.html';
    return;
  }

  try {
    const response = await $.ajax({
      url: 'http://localhost:3000/api/exam/student',
      type: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (response) {
      console.log(response);
      // Populate the exam page with data
      const examList = $('#examList');
      const examsContainer = $('<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"></div>');
      response.forEach(exam => {
        const examCard = $(`
          <div class="bg-white shadow-md rounded-lg p-6">
            <h2 class="text-lg font-semibold mb-2">${exam.title}</h2>
            <p class="text-gray-600 mb-4">${exam.description}</p>
            <div class="flex justify-between items-center">
              <a href="exam.html?id=${exam._id}" class="text-blue-500 hover:underline">Start Exam</a>
            </div>
          </div>
        `);
        examsContainer.append(examCard);
      });
      examList.append(examsContainer);
    } else {
      console.error('Failed to fetch exam data');
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
});
