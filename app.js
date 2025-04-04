/**
 * HamExam - 业余无线电台操作能力考核A类题库
 * 本文件包含应用程序的主要逻辑，负责加载和显示题目、视频和导航功能
 */

// 全局变量声明
let player; // Plyr视频播放器实例
let currentQuestionIndex = 0; // 当前显示的题目索引
let questions = []; // 当前加载的题目数组

// 初始化数据 - 创建包含Day1到Day19的数组，用于生成导航标签
const days = Array.from({ length: 19 }, (_, i) => `Day${i + 1}`);

/**
 * 初始化函数：在DOM加载完成后执行
 * 1. 生成19天的导航标签
 * 2. 为每个标签添加点击事件
 * 3. 默认加载第一天的题目
 */
document.addEventListener('DOMContentLoaded', () => {
    const tabsContainer = document.getElementById('day-tabs');

    // 为每一天创建导航标签
    days.forEach(day => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.textContent = day;
        li.appendChild(a);
        tabsContainer.appendChild(li);

        // 为导航标签添加点击事件
        a.addEventListener('click', (e) => {
            e.preventDefault();

            // 如果播放器已初始化，则销毁它以避免内存泄漏
            if (player) {
                player.destroy();
            }

            // 更新导航标签的激活状态
            document.querySelectorAll('#day-tabs li').forEach(tab => {
                tab.classList.remove('is-active');
            });
            li.classList.add('is-active');

            // 加载所选日期的题目
            loadDayQuestions(day);
        });
    });

    // 默认加载第一天的内容并激活对应标签
    loadDayQuestions('Day1');
    document.querySelector('#day-tabs li:first-child').classList.add('is-active');
});

/**
 * 显示指定索引的题目
 * 隐藏其他题目，只显示当前索引对应的题目
 *
 * @param {number} index - 要显示的题目索引
 */
function showQuestion(index) {
    const cards = document.querySelectorAll('.question-card');
    cards.forEach((card, i) => {
        card.style.display = i === index ? 'block' : 'none';
    });
}

/**
 * 切换显示所有题目或单一题目
 * 控制导航按钮的显示状态
 *
 * @param {boolean} showAll - 是否显示所有题目
 */
function toggleAllQuestions(showAll) {
    const cards = document.querySelectorAll('.question-card');
    const navButtons = document.querySelectorAll('.nav-button');

    // 根据showAll参数控制题目卡片的显示
    cards.forEach((card, i) => {
        card.style.display = (showAll || i === currentQuestionIndex) ? 'block' : 'none';
    });

    // 控制导航按钮的显示/隐藏
    navButtons.forEach(button => {
        button.style.display = showAll ? 'none' : 'block';
    });
}

/**
 * 加载指定日期的题目数据
 * 1. 清空当前题目容器
 * 2. 初始化视频播放器
 * 3. 加载对应日期的JSON数据
 * 4. 渲染题目到页面
 *
 * @param {string} day - 日期字符串，格式如'Day1'
 */
function loadDayQuestions(day) {
    // 获取DOM元素
    const questionsContainer = document.getElementById('questions-container');
    const title = document.getElementById('title');
    const playerElement = document.getElementById('player');

    // 清空题目容器
    questionsContainer.innerHTML = '';

    // 初始化Plyr视频播放器
    player = new Plyr(playerElement, {
        controls: ['play-large', 'play', 'progress', 'current-time', 'settings', 'fullscreen']
    });

    // 提取日期编号并构建资源路径
    const dayNumber = day.replace('Day', '');
    const jsonPath = `/data_dailystudy/Day${dayNumber}.json`;
    const videoPath = `/data_dailystudy/Day${dayNumber}.mp4`;

    // 设置视频源
    playerElement.innerHTML = `<source src="${videoPath}" type="video/mp4" />`;

    // 使用fetch加载JSON文件
    fetch(jsonPath)
        .then(response => response.json())
        .then(data => {
            // 设置标题
            title.innerText = data.title;

            // 处理题目数据
            questions = data.questions.map((q, index) => ({
                id: q.number,
                question: q.question,
                options: q.options,
                answer: String.fromCharCode(65 + q.correct), // 将数字索引转换为A、B、C、D
                explanation: q.analysis
            }));

            // 渲染题目
            renderQuestions(questions);
        })
        .catch(error => {
            console.error('加载题目数据失败:', error);
            questionsContainer.innerHTML = '<div class="notification is-danger">加载题目数据失败，请刷新页面重试</div>';
        });
}

/**
 * 渲染题目列表
 * 1. 为每个题目创建卡片
 * 2. 添加选项、答案和解析
 * 3. 添加导航按钮
 *
 * @param {Array} questionsList - 题目数组
 */
function renderQuestions(questionsList) {
    const questionsContainer = document.getElementById('questions-container');

    // 为每个题目创建卡片
    questionsList.forEach(q => {
        const card = document.createElement('div');
        card.className = 'box question-card';

        // 创建题目标题
        const question = document.createElement('h3');
        question.className = 'subtitle';
        question.textContent = `${q.question}`;
        card.appendChild(question);

        // 创建选项列表
        const optionsList = document.createElement('div');
        optionsList.className = 'content';

        q.options.forEach((opt, i) => {
            const option = document.createElement('p');
            option.textContent = `${String.fromCharCode(65 + i)}. ${opt}`;
            optionsList.appendChild(option);
        });
        card.appendChild(optionsList);

        // 创建显示/隐藏答案按钮
        const answerBtn = document.createElement('button');
        answerBtn.className = 'button is-info';
        answerBtn.textContent = '显示答案';
        card.appendChild(answerBtn);

        // 创建答案和解析区域
        const answerDiv = document.createElement('div');
        answerDiv.className = 'notification is-hidden';
        answerDiv.innerHTML = `<strong>正确答案: ${q.answer}</strong><br>${q.explanation}`;
        card.appendChild(answerDiv);

        // 为答案按钮添加点击事件
        answerBtn.addEventListener('click', () => {
            answerDiv.classList.toggle('is-hidden');
            answerBtn.textContent = answerDiv.classList.contains('is-hidden')
                ? '显示答案'
                : '隐藏答案';

            // 滚动到卡片中心位置以便查看答案
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });

        questionsContainer.appendChild(card);
    });

    // 添加导航按钮
    const navDiv = document.createElement('div');
    navDiv.className = 'buttons is-centered';

    // 上一题按钮
    const prevBtn = document.createElement('button');
    prevBtn.className = 'button is-primary is-light nav-button';
    prevBtn.textContent = '上一题';
    prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            showQuestion(currentQuestionIndex);

            // 获取当前显示的卡片并滚动到视图中
            const currentCard = document.querySelectorAll('.question-card')[currentQuestionIndex];
            if (currentCard) {
                currentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    // 下一题按钮
    const nextBtn = document.createElement('button');
    nextBtn.className = 'button is-primary is-light nav-button';
    nextBtn.textContent = '下一题';
    nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < questionsList.length - 1) {
            currentQuestionIndex++;
            showQuestion(currentQuestionIndex);

            // 获取当前显示的卡片并滚动到视图中
            const currentCard = document.querySelectorAll('.question-card')[currentQuestionIndex];
            if (currentCard) {
                currentCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    });

    navDiv.appendChild(prevBtn);
    navDiv.appendChild(nextBtn);

    // 切换显示模式按钮
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

    // 重置当前题目索引并显示第一题
    currentQuestionIndex = 0;
    showQuestion(currentQuestionIndex);
}
