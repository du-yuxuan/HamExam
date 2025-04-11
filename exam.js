/**
 * HamExam - 业余无线电台操作能力考核A类模拟考试
 * 本文件包含模拟考试的主要逻辑，负责题目随机抽取、计时、答题和结果统计功能
 */

// 全局变量声明
let examQuestions = []; // 当前考试的题目数组
let userAnswers = {}; // 用户答案，格式为 {题目索引: 选择的选项索引}
let currentQuestionIndex = 0; // 当前显示的题目索引
let examTimer; // 计时器
let examTimeLeft = 40 * 60; // 考试剩余时间（秒）
let examStarted = false; // 考试是否已开始
let examFinished = false; // 考试是否已结束
let examStartTime; // 考试开始时间

// 日期数组，用于加载所有题目
const days = Array.from({ length: 19 }, (_, i) => `Day${i + 1}`);

/**
 * 初始化函数：在DOM加载完成后执行
 * 1. 为按钮添加事件监听器
 * 2. 初始化页面状态
 */
document.addEventListener('DOMContentLoaded', () => {
    // 为开始考试按钮添加事件监听器
    document.getElementById('start-exam').addEventListener('click', startExam);

    // 为导航按钮添加事件监听器
    document.getElementById('prev-question').addEventListener('click', showPreviousQuestion);
    document.getElementById('next-question').addEventListener('click', showNextQuestion);

    // 为提交试卷按钮添加事件监听器
    document.getElementById('submit-exam').addEventListener('click', submitExam);

    // 为退出考试按钮添加事件监听器
    document.getElementById('exit-exam').addEventListener('click', exitExam);

    // 为结果页面按钮添加事件监听器
    document.getElementById('show-all-questions').addEventListener('click', () => reviewQuestions('all'));
    document.getElementById('show-incorrect-questions').addEventListener('click', () => reviewQuestions('incorrect'));
    document.getElementById('show-correct-questions').addEventListener('click', () => reviewQuestions('correct'));
    document.getElementById('show-unanswered-questions').addEventListener('click', () => reviewQuestions('unanswered'));
    document.getElementById('restart-exam').addEventListener('click', restartExam);

    // 为主页的查看历史按钮添加事件监听器
    const mainPageHistoryBtn = document.querySelector('#exam-intro #show-history');
    if (mainPageHistoryBtn) {
        mainPageHistoryBtn.addEventListener('click', showExamHistory);
    }

    // 为结果页面的历史记录按钮添加事件监听器
    const resultPageHistoryBtn = document.querySelector('#result-container #show-history');
    if (resultPageHistoryBtn) {
        resultPageHistoryBtn.addEventListener('click', showExamHistory);
    }

    // 为错题集按钮添加事件监听器
    const wrongQuestionsBtn = document.getElementById('show-wrong-questions');
    if (wrongQuestionsBtn) {
        wrongQuestionsBtn.addEventListener('click', showWrongQuestions);
    }

    // 为历史记录按钮添加事件监听器（兼容性处理）
    document.getElementById('show-history').addEventListener('click', showExamHistory);
    document.getElementById('close-history').addEventListener('click', () => {
        document.getElementById('history-modal').classList.remove('is-active');
    });
    document.getElementById('close-history-detail').addEventListener('click', () => {
        document.getElementById('history-detail-modal').classList.remove('is-active');
        document.getElementById('history-modal').classList.add('is-active');
    });
    document.getElementById('clear-history').addEventListener('click', () => {
        if (confirm('确定要清空所有考试历史记录吗？')) {
            clearExamHistory();
            renderExamHistory();
        }
    });
});

/**
 * 开始考试
 * 1. 加载所有题目
 * 2. 随机抽取30道题目
 * 3. 渲染题目和答题卡
 * 4. 开始计时
 */
function startExam() {
    // 显示加载提示
    document.getElementById('exam-intro').innerHTML = '<div class="has-text-centered"><h2 class="subtitle">正在加载题目...</h2><progress class="progress is-primary" max="100"></progress></div>';

    // 加载所有题目
    loadAllQuestions()
        .then(allQuestions => {
            // 随机抽取30道题目
            examQuestions = getRandomQuestions(allQuestions, 30);

            // 隐藏介绍区域，显示考试区域
            document.getElementById('exam-intro').classList.add('is-hidden');
            document.getElementById('exam-container').classList.remove('is-hidden');

            // 渲染题目和答题卡
            renderExamQuestions(examQuestions);
            renderAnswerSheet(examQuestions.length);

            // 显示第一道题目
            showQuestion(0);

            // 开始计时
            startTimer();

            // 记录考试开始时间
            examStartTime = new Date();
            examStarted = true;
        })
        .catch(error => {
            console.error('加载题目失败:', error);
            document.getElementById('exam-intro').innerHTML = '<div class="notification is-danger">加载题目失败，请刷新页面重试</div>';
        });
}

/**
 * 加载所有题目
 * 从Day1到Day19的JSON文件中加载所有题目
 *
 * @returns {Promise<Array>} 包含所有题目的Promise
 */
async function loadAllQuestions() {
    try {
        const allQuestions = [];

        // 使用Promise.all并行加载所有题目
        const questionsPromises = days.map(day => {
            const dayNumber = day.replace('Day', '');
            const jsonPath = `/data_dailystudy/Day${dayNumber}.json`;

            return fetch(jsonPath)
                .then(response => response.json())
                .then(data => {
                    // 处理题目数据
                    return data.questions.map(q => ({
                        id: q.number,
                        lk_number: q.lk_number,
                        question: q.question,
                        options: q.options,
                        correct: q.correct,
                        explanation: q.analysis
                    }));
                });
        });

        // 等待所有题目加载完成
        const questionsArrays = await Promise.all(questionsPromises);

        // 合并所有题目
        questionsArrays.forEach(questions => {
            allQuestions.push(...questions);
        });

        return allQuestions;
    } catch (error) {
        console.error('加载题目失败:', error);
        throw error;
    }
}

/**
 * 从题目数组中随机抽取指定数量的题目
 *
 * @param {Array} questions - 所有题目数组
 * @param {number} count - 要抽取的题目数量
 * @returns {Array} 随机抽取的题目数组
 */
function getRandomQuestions(questions, count) {
    // 复制题目数组，避免修改原数组
    const shuffled = [...questions];

    // 随机打乱题目顺序
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // 返回前count个题目
    return shuffled.slice(0, count);
}

/**
 * 渲染考试题目
 * 为每个题目创建卡片，添加选项
 *
 * @param {Array} questions - 题目数组
 */
function renderExamQuestions(questions) {
    const questionsContainer = document.getElementById('questions-container');
    questionsContainer.innerHTML = '';

    // 为每个题目创建卡片
    questions.forEach((q, index) => {
        const card = document.createElement('div');
        card.className = 'box question-card';
        card.dataset.index = index;
        card.style.display = 'none'; // 初始隐藏所有题目

        // 创建题目标题
        const questionTitle = document.createElement('h3');
        questionTitle.className = 'subtitle';
        questionTitle.innerHTML = `<span class="has-text-weight-bold">${index + 1}.</span> ${q.question.replace(/^\d+\.\s*\[\w+\]/, '')}`;
        card.appendChild(questionTitle);

        // 创建选项列表
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'content';

        // 为每个选项创建标签和单选按钮
        q.options.forEach((opt, i) => {
            const optionLabel = document.createElement('label');
            optionLabel.className = 'option-label';
            optionLabel.dataset.index = i;

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `question-${index}`;
            radio.value = i;
            radio.className = 'mr-2';
            radio.addEventListener('change', () => selectAnswer(index, i));

            optionLabel.appendChild(radio);
            optionLabel.appendChild(document.createTextNode(`${String.fromCharCode(65 + i)}. ${opt}`));
            optionsContainer.appendChild(optionLabel);
        });

        card.appendChild(optionsContainer);
        questionsContainer.appendChild(card);
    });
}

/**
 * 渲染答题卡
 * 创建答题卡按钮，添加点击事件
 *
 * @param {number} count - 题目数量
 */
function renderAnswerSheet(count) {
    const answerSheetContainer = document.getElementById('answer-sheet-buttons');
    answerSheetContainer.innerHTML = '';

    // 为每个题目创建答题卡按钮
    for (let i = 0; i < count; i++) {
        const button = document.createElement('button');
        button.className = 'button answer-button';
        button.textContent = i + 1;
        button.addEventListener('click', () => showQuestion(i));
        answerSheetContainer.appendChild(button);
    }
}

/**
 * 显示指定索引的题目
 *
 * @param {number} index - 要显示的题目索引
 */
function showQuestion(index) {
    // 确保索引在有效范围内
    if (index < 0 || index >= examQuestions.length) return;

    // 更新当前题目索引
    currentQuestionIndex = index;

    // 隐藏所有题目，只显示当前题目
    const cards = document.querySelectorAll('.question-card');
    cards.forEach(card => {
        card.style.display = 'none';
    });
    cards[index].style.display = 'block';

    // 更新导航按钮状态
    updateNavigationButtons();

    // 如果用户已经选择了答案，选中对应的单选按钮
    if (userAnswers[index] !== undefined) {
        const radio = document.querySelector(`input[name="question-${index}"][value="${userAnswers[index]}"]`);
        if (radio) radio.checked = true;
    }
}

/**
 * 显示上一题
 */
function showPreviousQuestion() {
    if (currentQuestionIndex > 0) {
        showQuestion(currentQuestionIndex - 1);
    }
}

/**
 * 显示下一题
 */
function showNextQuestion() {
    if (currentQuestionIndex < examQuestions.length - 1) {
        showQuestion(currentQuestionIndex + 1);
    }
}

/**
 * 更新导航按钮状态
 * 禁用或启用上一题/下一题按钮
 */
function updateNavigationButtons() {
    const prevButton = document.getElementById('prev-question');
    const nextButton = document.getElementById('next-question');

    // 如果是第一题，禁用上一题按钮
    prevButton.disabled = currentQuestionIndex === 0;

    // 如果是最后一题，禁用下一题按钮
    nextButton.disabled = currentQuestionIndex === examQuestions.length - 1;
}

/**
 * 选择答案
 *
 * @param {number} questionIndex - 题目索引
 * @param {number} optionIndex - 选项索引
 */
function selectAnswer(questionIndex, optionIndex) {
    // 记录用户答案
    userAnswers[questionIndex] = optionIndex;

    // 更新答题卡按钮状态
    const answerButtons = document.querySelectorAll('.answer-button');
    answerButtons[questionIndex].classList.add('answered');

    // 更新已答题数量和进度条
    updateProgress();

    // 高亮选中的选项
    const optionLabels = document.querySelectorAll(`.question-card[data-index="${questionIndex}"] .option-label`);
    optionLabels.forEach(label => {
        label.classList.remove('selected');
    });
    optionLabels[optionIndex].classList.add('selected');

    // 如果是最后一题，不自动跳转
    if (questionIndex < examQuestions.length - 1) {
        // 延迟跳转到下一题，给用户一点时间看到自己的选择
        setTimeout(() => {
            showQuestion(questionIndex + 1);
        }, 300);
    }
}

/**
 * 更新进度信息
 * 更新已答题数量和进度条
 */
function updateProgress() {
    const answeredCount = Object.keys(userAnswers).length;
    document.getElementById('answered-count').textContent = answeredCount;
    document.getElementById('exam-progress').value = answeredCount;
}

/**
 * 开始计时器
 * 每秒更新一次剩余时间
 */
function startTimer() {
    examTimer = setInterval(() => {
        examTimeLeft--;

        // 更新计时器显示
        updateTimerDisplay();

        // 如果时间到，自动提交试卷
        if (examTimeLeft <= 0) {
            clearInterval(examTimer);
            submitExam();
        }
    }, 1000);

    // 初始化计时器显示
    updateTimerDisplay();
}

/**
 * 更新计时器显示
 */
function updateTimerDisplay() {
    const minutes = Math.floor(examTimeLeft / 60);
    const seconds = examTimeLeft % 60;
    document.getElementById('timer').textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // 如果剩余时间少于5分钟，显示红色警告
    if (examTimeLeft < 300) {
        document.getElementById('timer').classList.add('has-text-danger');
    }
}

/**
 * 提交试卷
 * 计算得分，显示结果，自动保存历史
 */
function submitExam() {
    // 如果考试已结束，不执行任何操作
    if (examFinished) return;

    // 停止计时器
    clearInterval(examTimer);
    examFinished = true;

    // 计算得分和用时
    const score = calculateScore();
    const timeUsed = calculateTimeUsed();

    // 更新结果页面
    document.getElementById('score').textContent = score.correct;
    document.getElementById('time-used').textContent = timeUsed;
    document.getElementById('correct-count').textContent = score.correct;
    document.getElementById('incorrect-count').textContent = score.incorrect;

    // 隐藏考试区域，显示结果区域
    document.getElementById('exam-container').classList.add('is-hidden');
    document.getElementById('result-container').classList.remove('is-hidden');

    // 自动保存历史记录
    saveCurrentExamToHistory();

    // 自动保存错题
    autoSaveWrongQuestions();

    // 默认显示所有题目的回顾
    reviewQuestions('all');
}

/**
 * 计算得分
 *
 * @returns {Object} 包含正确和错误题目数量的对象
 */
function calculateScore() {
    let correct = 0;
    let incorrect = 0;

    // 遍历所有题目，检查答案是否正确
    examQuestions.forEach((q, index) => {
        if (userAnswers[index] === undefined) {
            // 未答题算错题
            incorrect++;
        } else if (userAnswers[index] === q.correct) {
            // 答案正确
            correct++;
        } else {
            // 答案错误
            incorrect++;
        }
    });

    return { correct, incorrect };
}

/**
 * 计算考试用时
 *
 * @returns {string} 格式化的用时字符串
 */
function calculateTimeUsed() {
    const endTime = new Date();
    const timeUsedMs = endTime - examStartTime;
    const timeUsedMinutes = Math.floor(timeUsedMs / 60000);
    const timeUsedSeconds = Math.floor((timeUsedMs % 60000) / 1000);

    return `${timeUsedMinutes}分${timeUsedSeconds}秒`;
}

/**
 * 查看题目回顾
 *
 * @param {string} mode - 查看模式，'all'表示所有题目，'incorrect'表示只看错题（不包含未作答），'correct'表示只看正确题，'unanswered'表示只看未作答题
 */
function reviewQuestions(mode) {
    const reviewContainer = document.getElementById('review-questions-container');
    reviewContainer.innerHTML = '';

    // 遍历所有题目
    examQuestions.forEach((q, index) => {
        const userAnswer = userAnswers[index];
        const isCorrect = userAnswer === q.correct;
        const isAnswered = userAnswer !== undefined;

        // 根据模式筛选题目
        if (mode === 'incorrect' && (isCorrect || !isAnswered)) return;
        if (mode === 'correct' && !isCorrect) return;
        if (mode === 'unanswered' && isAnswered) return;

        // 创建题目卡片
        const card = document.createElement('div');
        card.className = `box question-card ${isCorrect ? 'has-background-success-light' : 'has-background-danger-light'}`;

        // 创建题目标题
        const questionTitle = document.createElement('h3');
        questionTitle.className = 'subtitle';
        questionTitle.innerHTML = `<span class="has-text-weight-bold">${index + 1}.</span> ${q.question.replace(/^\d+\.\s*\[\w+\]/, '')}`;
        card.appendChild(questionTitle);

        // 创建选项列表
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'content';

        // 为每个选项创建标签
        q.options.forEach((opt, i) => {
            const optionLabel = document.createElement('div');
            optionLabel.className = 'option-label';

            // 根据答案状态设置样式
            if (i === q.correct) {
                optionLabel.classList.add('correct');
            } else if (i === userAnswer && !isCorrect) {
                optionLabel.classList.add('incorrect');
            }

            optionLabel.innerHTML = `${String.fromCharCode(65 + i)}. ${opt} ${i === q.correct ? '<span class="icon has-text-success"><i class="fas fa-check"></i></span>' : ''}`;
            optionsContainer.appendChild(optionLabel);
        });

        card.appendChild(optionsContainer);

        // 添加解析
        const explanation = document.createElement('div');
        explanation.className = 'notification is-light';
        explanation.innerHTML = `<strong>解析:</strong> ${q.explanation}`;
        card.appendChild(explanation);

        // 添加用户答案状态
        const answerStatus = document.createElement('div');
        answerStatus.className = 'has-text-right';

        if (!isAnswered) {
            answerStatus.innerHTML = '<span class="tag is-warning">未作答</span>';
        } else if (isCorrect) {
            answerStatus.innerHTML = '<span class="tag is-success">回答正确</span>';
        } else {
            answerStatus.innerHTML = `<span class="tag is-danger">回答错误</span> <span class="has-text-weight-bold">您的答案: ${String.fromCharCode(65 + userAnswer)}</span>`;
        }

        card.appendChild(answerStatus);
        reviewContainer.appendChild(card);
    });
}

/**
 * 退出考试
 */
function exitExam() {
    // 如果考试未开始或已结束，不执行任何操作
    if (!examStarted || examFinished) return;

    if (confirm('确定要退出考试吗？当前进度将会被自动保存。')) {
        // 停止计时器
        clearInterval(examTimer);

        // 标记考试已结束
        examFinished = true;

        // 自动保存历史记录
        saveCurrentExamToHistory();

        // 重置状态
        examQuestions = [];
        userAnswers = {};
        currentQuestionIndex = 0;
        examTimeLeft = 40 * 60;
        examStarted = false;
        examFinished = false;

        // 恢复介绍区域的原始内容
        document.getElementById('exam-intro').innerHTML = `
            <h2 class="subtitle">模拟考试说明</h2>
            <div class="content">
                <p>本模拟考试从题库中随机抽取30道题目，考试时间为40分钟。</p>
                <p>考试过程中，您可以通过右侧答题卡快速导航到不同题目。</p>
                <p>完成所有题目后，点击"提交试卷"按钮查看考试结果。</p>
            </div>
            <div class="field is-grouped">
                <p class="control">
                    <button id="start-exam" class="button is-primary is-medium">
                        <span class="icon"><i class="fas fa-play"></i></span>
                        <span>开始考试</span>
                    </button>
                </p>
                <p class="control">
                    <button id="show-history" class="button is-info is-medium">
                        <span class="icon"><i class="fas fa-history"></i></span>
                        <span>查看历史</span>
                    </button>
                </p>
            </div>
        `;

        // 为重新生成的按钮添加事件监听器
        document.getElementById('start-exam').addEventListener('click', startExam);
        document.getElementById('show-history').addEventListener('click', showExamHistory);

        // 隐藏考试区域，显示介绍区域
        document.getElementById('exam-container').classList.add('is-hidden');
        document.getElementById('exam-intro').classList.remove('is-hidden');

        // 确保结果页面的历史按钮也有事件监听器
        const resultPageHistoryBtn = document.querySelector('#result-container #show-history');
        if (resultPageHistoryBtn) {
            resultPageHistoryBtn.addEventListener('click', showExamHistory);
        }
    }
}

/**
 * 保存当前考试到历史记录
 */
function saveCurrentExamToHistory() {
    // 创建考试记录对象
    const examRecord = {
        date: new Date().toLocaleString(),
        questions: examQuestions,
        userAnswers: userAnswers,
        score: calculateScore(),
        timeUsed: examFinished ? document.getElementById('time-used').textContent : calculateTimeUsed(),
        totalQuestions: examQuestions.length
    };

    // 保存到历史记录
    saveExamHistory(examRecord);
}

/**
 * 显示考试历史记录
 */
function showExamHistory() {
    // 渲染历史记录
    renderExamHistory();

    // 显示历史记录模态框
    document.getElementById('history-modal').classList.add('is-active');
}

/**
 * 回到主页
 */
function restartExam() {
    // 重置状态
    examQuestions = [];
    userAnswers = {};
    currentQuestionIndex = 0;
    examTimeLeft = 40 * 60;
    examStarted = false;
    examFinished = false;

    // 隐藏结果区域，显示介绍区域
    document.getElementById('result-container').classList.add('is-hidden');
    document.getElementById('exam-intro').classList.remove('is-hidden');
    document.getElementById('exam-intro').innerHTML = `
        <h2 class="subtitle">模拟考试说明</h2>
        <div class="content">
            <p>本模拟考试从题库中随机抽取30道题目，考试时间为40分钟。</p>
            <p>考试过程中，您可以通过右侧答题卡快速导航到不同题目。</p>
            <p>完成所有题目后，点击"提交试卷"按钮查看考试结果。</p>
        </div>
        <div class="field is-grouped">
            <p class="control">
                <button id="start-exam" class="button is-primary is-medium">
                    <span class="icon"><i class="fas fa-play"></i></span>
                    <span>开始考试</span>
                </button>
            </p>
            <p class="control">
                <button id="show-history" class="button is-info is-medium">
                    <span class="icon"><i class="fas fa-history"></i></span>
                    <span>查看历史</span>
                </button>
            </p>
            <p class="control">
                <button id="show-wrong-questions" class="button is-danger is-medium">
                    <span class="icon"><i class="fas fa-exclamation-triangle"></i></span>
                    <span>错题集</span>
                </button>
            </p>
        </div>
    `;

    // 重新添加按钮事件
    document.getElementById('start-exam').addEventListener('click', startExam);
    document.getElementById('show-history').addEventListener('click', showExamHistory);

    // 确保结果页面的历史按钮也有事件监听器
    const resultPageHistoryBtn = document.querySelector('#result-container #show-history');
    if (resultPageHistoryBtn) {
        resultPageHistoryBtn.addEventListener('click', showExamHistory);
    }

    // 确保错题集按钮也有事件监听器
    const wrongQuestionsBtn = document.getElementById('show-wrong-questions');
    if (wrongQuestionsBtn) {
        wrongQuestionsBtn.addEventListener('click', showWrongQuestions);
    }
}
