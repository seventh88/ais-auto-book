var email = 'your username'; // User email for login
var pwd = 'your password'; // User password for login
var start = '2025-04-01'; // Desired appointment start date (YYYY-MM-DD)
var end = '2025-04-02'; // Desired appointment end date (YYYY-MM-DD)
var exclude = ['2025-04-01', '2025-04-02']; // Dates to exclude from booking even if available
var locationId = 17; //17:London 16:Belfast
var country = 'gb'; // Country code (e.g., gb = UK, ca = Canada, ae = UAE)
var intervalSecond = 2 * 60; // Interval in seconds to check for new slots (e.g., 120s)

const route = async () => {
    const u = window.location.href;
    if (document.title === 'Under construction (503)') await reload(10);
    else if (u.endsWith('niv/users/sign_in')) await login();
    else if (u.indexOf('niv/groups/') > -1) {
        showToast('Load Home Page...');
        await delay(3);
        var path = $("a.button[href$='continue_actions']").attr('href');
        location.href = path.replace('continue_actions', 'appointment');
    } else if (u.endsWith('/appointment')) {
        showToast('Load Appointment Page...');
        $('#appointments_consulate_appointment_facility_id').val(locationId);
        $('#consulate_date_time').show();
        $('#appointments_consulate_appointment_date').removeAttr('readonly');
        $('#appointments_submit').removeAttr('disabled');
        $('#consulate_left').append(
            `<div id='log_container' class='margin-right-0 card' style='overflow: auto; height: 240px; margin-left:0; padding:15px'></div>`
        );
        log(
            `Desired Range: [${start} to ${end}], exclude:[${exclude}], interval:${intervalSecond}s`
        );
        await delay(5);
        doJob();
        setInterval(doJob, intervalSecond * 1000);
    } else {
        showToast('Not a valid page for auto booking.');
    }
};

const login = async () => {
    showToast('Auto Login...');
    await delay(3);
    $('#policy_confirmed').trigger('click');
    $('#user_password').val(pwd);
    $('#user_email').val(email);
    $('[name=commit]').trigger('click');
    await delay(2);
    const error = $('#sign_in_form').find('.error').text().trim();
    if (error.includes('Invalid email or password')) {
        showToast(error);
    } else {
        this.reload(10);
    }
};

const doJob = async () => {
    try {
        const daysUrl = `appointment/days/${locationId}.json?appointments[expedite]=false`;
        var dayData = await ajaxGet(daysUrl, 4500);
        var days = dayData.map(({ date }) => date);
        log(days.length > 0 ? 'Earlist date:' + days[0] : 'No available dates');
        const suitable = days.filter(
            (x) => x >= start && x <= end && !exclude.includes(x)
        );
        if (!suitable.length) {
            return;
        }
        const date = suitable[0];
        const timesUrl = `appointment/times/${locationId}.json?appointments[expedite]=false&date=${date}`;
        const timeData = await ajaxGet(timesUrl, 4500);
        if (!timeData.available_times.length) {
            log('No available times');
            return;
        }
        const time = timeData.available_times[0];
        $('#appointments_consulate_appointment_facility_id').val(locationId);
        $('#appointments_consulate_appointment_date').val(date);
        $('#appointments_consulate_appointment_time')
            .empty()
            .append(new Option(time, time))
            .val(time);
        $('#appointment-form').trigger('submit');
    } catch (e) {
        log(e);
    }
};

const delay = (s) => new Promise((r) => setTimeout(r, s * 1000));
const reload = async (s) => (await delay(s), (location.href = location.href));
const ajaxGet = (u, t) =>
    $.ajax({ url: u, type: 'GET', timeout: t }).fail((jq, x, e) => {
        if (jq.status === 401) {
            window.location.href = `/en-${country}/niv/users/sign_in`;
        } else {
            console.error(e);
            log(`Ajax error on ${u}: ${x}`, e);
        }
    });

const log = (m) => {
    let c = $('#log_container');
    c.find('div').length > 60 && c.empty();
    c.append(`<div>${getTime()} ${m}</div>`);
    c[0].scrollTop = c[0].scrollHeight;
};

const getTime = () => {
    const d = new Date();
    return d.getHours() + ':' + d.getMinutes() + ':' + d.getSeconds();
};

const showToast = (msg, duration = 3000) => {
    const toast = Object.assign(document.createElement('div'), {
        textContent: msg,
        style: 'position:fixed;bottom:60%;left:50%;transform:translateX(-50%);background:rgba(0, 0, 0, 0.7);color:white;padding:10px 20px;border-radius:5px;z-index:10000',
    });
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.transition = 'opacity 0.5s';
        toast.style.opacity = 0;
        setTimeout(() => document.body.removeChild(toast), 500);
    }, duration);
};
$('.emergency-announcement').hide();
route();
