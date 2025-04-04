// 初始化数据
const days = Array.from({length: 19}, (_, i) => `Day${i+1}`);

// 生成21天导航标签
document.addEventListener('DOMContentLoaded', () => {
    const tabsContainer = document.getElementById('day-tabs');

    days.forEach(day => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = day;
        li.appendChild(a);
        tabsContainer.appendChild(li);

        a.addEventListener('click', (e) => {
            player.destroy();
            e.preventDefault();

            // 移除所有标签的active class
            document.querySelectorAll('#day-tabs li').forEach(tab => {
                tab.classList.remove('is-active');
            });
            // 为当前点击的标签添加active class
            li.classList.add('is-active');

            loadDayQuestions(day);
        });
    });

    // 默认加载第一天
    loadDayQuestions('Day1');
});

// 加载某天的题目
let currentQuestionIndex = 0;
let questions = [];

function showQuestion(index) {
    const cards = document.querySelectorAll('.question-card');
    cards.forEach((card, i) => {
        card.style.display = i === index ? 'block' : 'none';
    });
}

function toggleAllQuestions(showAll) {
    const cards = document.querySelectorAll('.question-card');
    const navButtons = document.querySelectorAll('.nav-button');

    cards.forEach((card, i) => {
        card.style.display = (showAll || i === currentQuestionIndex) ? 'block' : 'none';
    });

    navButtons.forEach(button => {
        button.style.display = showAll ? 'none' : 'block';
    });
}

function loadDayQuestions(day) {

    const questionsContainer = document.getElementById('questions-container');
    const title = document.getElementById('title');
    const playerElement = document.getElementById('player')
    questionsContainer.innerHTML = '';
    player = new Plyr(playerElement);

    // 动态加载JSON数据
    const dayNumber = day.replace('Day', '');
    const jsonPath = `/data_dailystudy/Day${dayNumber}.json`;
    playerElement.innerHTML = `<source src="/data_dailystudy/Day${dayNumber}.mp4" type="video/mp4" />`


    // 使用fetch加载JSON文件
    fetch(jsonPath)
        .then(response => response.json())
        .then(data => {
            title.innerText = data.title;
            const questions = data.questions.map((q, index) => ({
                id: q.number,
                question: q.question,
                options: q.options,
                answer: String.fromCharCode(65 + q.correct),
                explanation: q.analysis
            }));
            renderQuestions(questions);
        })
        .catch(error => {
            console.error('加载题目数据失败:', error);
            questionsContainer.innerHTML = '<div class="notification is-danger">加载题目数据失败，请刷新页面重试</div>';
        })
    function renderQuestions(questions) {
    // 显示当前日期的标题

    questions.forEach(q => {
        const card = document.createElement('div');
        card.className = 'box question-card';

        const question = document.createElement('h3');
        question.className = 'subtitle';
        question.textContent = `${q.question}`;
        card.appendChild(question);

        const optionsList = document.createElement('div');
        optionsList.className = 'content';

        q.options.forEach((opt, i) => {
            const option = document.createElement('p');
            option.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
            optionsList.appendChild(option);
        });
        card.appendChild(optionsList);

        const answerBtn = document.createElement('button');
        answerBtn.className = 'button is-info';
        answerBtn.textContent = '显示答案';
        card.appendChild(answerBtn);

        const answerDiv = document.createElement('div');
        answerDiv.className = 'notification is-hidden';
        answerDiv.innerHTML = `<strong>正确答案: ${q.answer}</strong><br>${q.explanation}`;
        card.appendChild(answerDiv);

        answerBtn.addEventListener('click', () => {
            answerDiv.classList.toggle('is-hidden');
            answerBtn.textContent = answerDiv.classList.contains('is-hidden')
                ? '显示答案'
                : '隐藏答案';
            if(!answerDiv.classList.contains('is-hidden')) {
                card.scrollIntoView({behavior: 'smooth', block: 'center'});
            }
            else {
                card.scrollIntoView({behavior: 'smooth', block: 'center'});
            }
        });

        questionsContainer.appendChild(card);
    });

    // 添加导航按钮
    const navDiv = document.createElement('div');
    navDiv.className = 'buttons is-centered';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'button is-primary is-light nav-button';
    prevBtn.textContent = '上一题';
    prevBtn.addEventListener('click', () => {
        if(currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);
            card.scrollIntoView({block: 'center'});
        }
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'button is-primary is-light nav-button';
    nextBtn.textContent = '下一题';
    nextBtn.addEventListener('click', () => {
        if(currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);
            card.scrollIntoView({block: 'center'});
        }
    });

    navDiv.appendChild(prevBtn);
    navDiv.appendChild(nextBtn);

    const toggleAllBtn = document.createElement('button');
    toggleAllBtn.className = 'button is-dark is-primary';
    toggleAllBtn.textContent = '显示所有题目';
    let showAll = false;
    toggleAllBtn.addEventListener('click', () => {
        showAll = !showAll;
        toggleAllQuestions(showAll);
        toggleAllBtn.textContent = showAll ? '显示单一题目' : '显示所有题目';
    });
    navDiv.appendChild(toggleAllBtn);

    questionsContainer.appendChild(navDiv);

    // 显示第一题
    currentQuestionIndex = 0;
    showQuestion(currentQuestionIndex);
    }
}
