/**
 * HamExam - 业余无线电台操作能力考核A类错题集
 * 本文件包含错题集的保存、加载、显示和管理功能
 */

/**
 * 保存错题到错题集
 * 将错题保存到localStorage中
 *
 * @param {Object} examData - 考试数据对象
 */
function saveWrongQuestions(examData) {
    // 从localStorage获取现有的错题集
    let wrongQuestions = loadWrongQuestions();

    // 遍历考试中的题目，找出错题
    examData.questions.forEach((question, index) => {
        const userAnswer = examData.userAnswers[index];
        // 只处理已回答且回答错误的题目
        if (userAnswer !== undefined && userAnswer !== question.correct) {
            // 检查错题是否已存在
            const existingIndex = wrongQuestions.findIndex(q =>
                q.id === question.id && q.lk_number === question.lk_number
            );

            if (existingIndex === -1) {
                // 如果不存在，添加到错题集
                wrongQuestions.push({
                    ...question,
                    userAnswer: userAnswer,
                    reviewed: false, // 初始状态为未复习
                    date: examData.date, // 记录添加日期
                    examId: examData.date // 用日期作为考试ID，方便追踪
                });
            }
        }
    });

    // 保存到localStorage
    localStorage.setItem('hamExamWrongQuestions', JSON.stringify(wrongQuestions));
}

/**
 * 加载错题集
 * 从localStorage中获取保存的错题
 *
 * @returns {Array} 错题集数组
 */
function loadWrongQuestions() {
    return JSON.parse(localStorage.getItem('hamExamWrongQuestions')) || [];
}

/**
 * 清空错题集
 */
function clearWrongQuestions() {
    localStorage.removeItem('hamExamWrongQuestions');
}

/**
 * 标记错题为已复习
 *
 * @param {string} questionId - 题目ID
 * @param {string} lkNumber - 题目的lk编号
 * @param {boolean} reviewed - 是否已复习
 */
function markQuestionReviewed(questionId, lkNumber, reviewed) {
    const wrongQuestions = loadWrongQuestions();

    // 查找并更新题目的复习状态
    const questionIndex = wrongQuestions.findIndex(q =>
        q.id === questionId && q.lk_number === lkNumber
    );

    if (questionIndex !== -1) {
        wrongQuestions[questionIndex].reviewed = reviewed;
        localStorage.setItem('hamExamWrongQuestions', JSON.stringify(wrongQuestions));
    }
}

/**
 * 显示错题集
 */
function showWrongQuestions() {
    // 渲染错题集
    renderWrongQuestions('all');

    // 显示错题集模态框
    document.getElementById('wrong-questions-modal').classList.add('is-active');
}

/**
 * 渲染错题集
 *
 * @param {string} mode - 筛选模式：'all', 'reviewed', 'not-reviewed'
 */
function renderWrongQuestions(mode) {
    const wrongQuestionsContainer = document.getElementById('wrong-questions-list');
    const wrongQuestions = loadWrongQuestions();

    // 清空容器
    wrongQuestionsContainer.innerHTML = '';

    if (wrongQuestions.length === 0) {
        wrongQuestionsContainer.innerHTML = '<div class="notification is-light">暂无错题记录</div>';
        return;
    }

    // 筛选题目
    let filteredQuestions = wrongQuestions;
    if (mode === 'reviewed') {
        filteredQuestions = wrongQuestions.filter(q => q.reviewed);
    } else if (mode === 'not-reviewed') {
        filteredQuestions = wrongQuestions.filter(q => !q.reviewed);
    }

    if (filteredQuestions.length === 0) {
        wrongQuestionsContainer.innerHTML = '<div class="notification is-light">没有符合条件的错题</div>';
        return;
    }

    // 为每个错题创建卡片
    filteredQuestions.forEach((question, index) => {
        const card = document.createElement('div');
        card.className = 'box question-card has-background-danger-light';
        card.dataset.id = question.id;
        card.dataset.lkNumber = question.lk_number;

        // 创建题目标题
        const questionTitle = document.createElement('h3');
        questionTitle.className = 'subtitle';
        questionTitle.innerHTML = `<span class="has-text-weight-bold">${index + 1}.</span> ${question.question.replace(/^\d+\.\s*\[\w+\]/, '')}`;
        card.appendChild(questionTitle);

        // 创建选项列表
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'content';

        // 为每个选项创建标签
        question.options.forEach((opt, i) => {
            const optionLabel = document.createElement('div');
            optionLabel.className = 'option-label';

            // 根据答案状态设置样式
            if (i === question.correct) {
                optionLabel.classList.add('correct');
            } else if (i === question.userAnswer) {
                optionLabel.classList.add('incorrect');
            }

            optionLabel.innerHTML = `${String.fromCharCode(65 + i)}. ${opt} ${i === question.correct ? '<span class="icon has-text-success"><i class="fas fa-check"></i></span>' : ''}`;
            optionsContainer.appendChild(optionLabel);
        });

        card.appendChild(optionsContainer);

        // 添加解析
        const explanation = document.createElement('div');
        explanation.className = 'notification is-light';
        explanation.innerHTML = `<strong>解析:</strong> ${question.explanation}`;
        card.appendChild(explanation);

        // 添加用户答案状态和复习标记
        const statusContainer = document.createElement('div');
        statusContainer.className = 'is-flex is-justify-content-space-between is-align-items-center mt-3';

        // 用户答案状态
        const answerStatus = document.createElement('div');
        answerStatus.innerHTML = `<span class="tag is-danger">回答错误</span> <span class="has-text-weight-bold">您的答案: ${String.fromCharCode(65 + question.userAnswer)}</span>`;
        statusContainer.appendChild(answerStatus);

        // 复习标记
        const reviewCheckbox = document.createElement('label');
        reviewCheckbox.className = 'checkbox';
        reviewCheckbox.innerHTML = `
            <input type="checkbox" ${question.reviewed ? 'checked' : ''} class="review-checkbox">
            <span class="ml-2">已复习</span>
        `;

        // 为复习复选框添加事件监听器
        const checkbox = reviewCheckbox.querySelector('input');
        checkbox.addEventListener('change', function() {
            markQuestionReviewed(question.id, question.lk_number, this.checked);
            // 添加或移除reviewed类，配合CSS样式
            if (this.checked) {
                reviewCheckbox.classList.add('reviewed');
            } else {
                reviewCheckbox.classList.remove('reviewed');
            }
            // 如果当前模式是筛选的，可能需要在切换后重新渲染
            if (mode !== 'all') {
                setTimeout(() => renderWrongQuestions(mode), 100);
            }
        });

        // 初始化时设置reviewed类
        if (question.reviewed) {
            reviewCheckbox.classList.add('reviewed');
        }

        statusContainer.appendChild(reviewCheckbox);
        card.appendChild(statusContainer);

        // 添加日期信息
        const dateInfo = document.createElement('div');
        dateInfo.className = 'has-text-right has-text-grey is-size-7 mt-2';
        dateInfo.textContent = `添加日期: ${question.date}`;
        card.appendChild(dateInfo);

        wrongQuestionsContainer.appendChild(card);
    });
}

/**
 * 初始化错题集功能
 * 在DOM加载完成后执行
 */
document.addEventListener('DOMContentLoaded', () => {
    // 为错题集按钮添加事件监听器
    const wrongQuestionsBtn = document.getElementById('show-wrong-questions');
    if (wrongQuestionsBtn) {
        wrongQuestionsBtn.addEventListener('click', showWrongQuestions);
    }

    // 为错题集模态框关闭按钮添加事件监听器
    const closeWrongQuestionsBtn = document.getElementById('close-wrong-questions');
    if (closeWrongQuestionsBtn) {
        closeWrongQuestionsBtn.addEventListener('click', () => {
            document.getElementById('wrong-questions-modal').classList.remove('is-active');
        });
    }

    // 为错题集筛选按钮添加事件监听器
    const showAllWrongBtn = document.getElementById('show-all-wrong');
    const showReviewedBtn = document.getElementById('show-reviewed');
    const showNotReviewedBtn = document.getElementById('show-not-reviewed');
    const clearWrongQuestionsBtn = document.getElementById('clear-wrong-questions');

    if (showAllWrongBtn) {
        showAllWrongBtn.addEventListener('click', () => {
            setActiveWrongQuestionsFilterButton('show-all-wrong');
            renderWrongQuestions('all');
        });
    }

    if (showReviewedBtn) {
        showReviewedBtn.addEventListener('click', () => {
            setActiveWrongQuestionsFilterButton('show-reviewed');
            renderWrongQuestions('reviewed');
        });
    }

    if (showNotReviewedBtn) {
        showNotReviewedBtn.addEventListener('click', () => {
            setActiveWrongQuestionsFilterButton('show-not-reviewed');
            renderWrongQuestions('not-reviewed');
        });
    }

    if (clearWrongQuestionsBtn) {
        clearWrongQuestionsBtn.addEventListener('click', () => {
            if (confirm('确定要清空所有错题记录吗？')) {
                clearWrongQuestions();
                renderWrongQuestions('all');
            }
        });
    }
});

/**
 * 设置活动的错题集筛选按钮
 *
 * @param {string} activeButtonId - 活动按钮的ID
 */
function setActiveWrongQuestionsFilterButton(activeButtonId) {
    const filterButtons = [
        'show-all-wrong',
        'show-reviewed',
        'show-not-reviewed'
    ];

    filterButtons.forEach(id => {
        const button = document.getElementById(id);
        if (button) {
            if (id === activeButtonId) {
                button.classList.add('is-active');
            } else {
                button.classList.remove('is-active');
            }
        }
    });
}

/**
 * 在考试结束后自动保存错题
 * 这个函数会在exam.js中的submitExam函数中被调用
 */
function autoSaveWrongQuestions() {
    // 创建考试记录对象
    const examRecord = {
        date: new Date().toLocaleString(),
        questions: examQuestions,
        userAnswers: userAnswers,
        score: calculateScore(),
        timeUsed: examFinished ? document.getElementById('time-used').textContent : calculateTimeUsed(),
        totalQuestions: examQuestions.length
    };

    // 保存错题
    saveWrongQuestions(examRecord);
}
