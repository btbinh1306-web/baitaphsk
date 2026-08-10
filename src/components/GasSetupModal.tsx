import React, { useState, useEffect } from 'react';
import { getGasConfig, saveGasConfig } from '../services/gasService';
import { Settings, Copy, Check, Link2, Key, Database, Play, AlertCircle, HelpCircle, Code2, Server, Lock, Unlock } from 'lucide-react';

const APPS_SCRIPT_CODE = `// ==== CẤU HÌNH ====
var DRIVE_FOLDER_ID = "DÁN_ID_THƯ_MỤC_DRIVE";   // thư mục lưu ghi âm
var GV_PASSWORD     = "tbtt123";                  // mật khẩu giáo viên (đổi tùy ý)

function sheet_(){ return SpreadsheetApp.getActiveSpreadsheet().getActiveSheet(); }
var HEADERS = ["ID","Thời gian","Họ tên","Lớp","Bài","Số câu đúng","Đã làm","Tổng","Phần trăm",
               "Số câu sai","Chưa làm","Chi tiết câu sai","Bài tự luận","Link ghi âm",
               "Điểm nói (GV)","Nhận xét (GV)","Trạng thái"];

function ensureHeader_(sh){ if(sh.getLastRow()===0) sh.appendRow(HEADERS); }

// ---- Học sinh NỘP bài ----
function doPost(e){
  var sh = sheet_(); ensureHeader_(sh);
  var d = JSON.parse(e.postData.contents);

  if(d.action === "grade"){ return gradeSubmission_(sh, d); }  // giáo viên chấm

  // lưu các file ghi âm (mảng base64) vào Drive
  var links = [];
  if(d.audios && d.audios.length && DRIVE_FOLDER_ID && DRIVE_FOLDER_ID.indexOf("DÁN")<0){
    var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    d.audios.forEach(function(a,i){
      try{
        var bytes = Utilities.base64Decode(a.data);
        var blob = Utilities.newBlob(bytes, a.mime||"audio/webm", (d.name||"hs")+"_"+(i+1)+".webm");
        var f = folder.createFile(blob);
        f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        links.push((a.label||("Câu "+(i+1)))+": "+f.getUrl());
      }catch(err){ links.push("(lỗi lưu ghi âm "+(i+1)+")"); }
    });
  }
  var id = Utilities.getUuid().slice(0,8);
  sh.appendRow([id, d.time, d.name, d.class, d.lesson, d.correct, d.done, d.total,
                d.percent+"%", d.wrongCount, d.notDone, d.wrong, d.essays,
                links.join("\\n"), "", "", "Chờ chấm"]);
  return json_({ok:true, id:id});
}

// ---- Giáo viên hoặc Học sinh ĐỌC dữ liệu ----
function doGet(e){
  var sh = sheet_(); ensureHeader_(sh);
  var p = e.parameter;
  var rows = sh.getDataRange().getValues();
  var head = rows.shift();

  if(p.mode === "teacher"){
    if(p.pass !== GV_PASSWORD) return json_({ok:false, error:"Sai mật khẩu"});
    var list = rows.map(function(r){ var o={}; head.forEach(function(h,i){o[h]=r[i];}); return o; });
    return json_({ok:true, rows:list});
  }
  if(p.mode === "result"){   // học sinh xem kết quả theo ID
    var found = null;
    rows.forEach(function(r){ if(String(r[0])===String(p.id)){ var o={}; head.forEach(function(h,i){o[h]=r[i];}); found=o; } });
    return json_(found ? {ok:true, row:found} : {ok:false, error:"Không tìm thấy mã này"});
  }
  return json_({ok:true, msg:"HSK submit endpoint"});
}

// ---- Giáo viên chấm: ghi điểm nói + nhận xét theo ID ----
function gradeSubmission_(sh, d){
  if(d.pass !== GV_PASSWORD) return json_({ok:false, error:"Sai mật khẩu"});
  var rows = sh.getDataRange().getValues();
  for(var i=1;i<rows.length;i++){
    if(String(rows[i][0])===String(d.id)){
      sh.getRange(i+1, 15).setValue(d.speakScore||"");  // cột "Điểm nói (GV)"
      sh.getRange(i+1, 16).setValue(d.comment||"");      // cột "Nhận xét (GV)"
      sh.getRange(i+1, 17).setValue("Đã chấm");          // cột "Trạng thái"
      return json_({ok:true});
    }
  }
  return json_({ok:false, error:"Không tìm thấy ID"});
}

function json_(o){ return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }`;

export const GasSetupModal: React.FC = () => {
  const [sheetUrl, setSheetUrl] = useState('');
  const [teacherPass, setTeacherPass] = useState('tbtt123');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);

  // Authentication state
  const [passwordInput, setPasswordInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const conf = getGasConfig();
    setSheetUrl(conf.sheetUrl || '');
    setTeacherPass(conf.teacherPass || 'tbtt123');
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const conf = getGasConfig();
    const currentPass = conf.teacherPass || 'tbtt123';
    if (!passwordInput.trim()) {
      setAuthError('Vui lòng nhập mật khẩu giáo viên');
      return;
    }
    if (passwordInput.trim() === currentPass) {
      setIsAuthenticated(true);
      setPasswordInput('');
    } else {
      setAuthError('Mật khẩu giáo viên không chính xác. Vui lòng thử lại.');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveGasConfig({
      sheetUrl: sheetUrl.trim(),
      teacherPass: teacherPass.trim() || 'tbtt123'
    });
    setSaveStatus('Đã lưu cấu hình Google Sheet thành công!');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleTestConnection = async () => {
    if (!sheetUrl.trim()) {
      setTestResult({ ok: false, message: 'Vui lòng nhập Link Web App Google Apps Script trước.' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch(sheetUrl.trim());
      const data = await res.json();
      if (data && data.ok) {
        setTestResult({ ok: true, message: 'Kết nối thành công! Google Apps Script hoạt động bình thường.' });
      } else {
        setTestResult({ ok: false, message: 'Apps Script phản hồi nhưng có lỗi: ' + JSON.stringify(data) });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: 'Lỗi kết nối. Vui lòng kiểm tra lại xem Web App đã được chọn "Anyone" (Bất kỳ ai) khi Deploy chưa.'
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-red-50 text-red-700 rounded-2xl flex items-center justify-center mx-auto border border-red-100">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Cấu Hình Google Sheet</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Khu vực này dành riêng cho giáo viên. Vui lòng nhập mật khẩu giáo viên để truy cập.
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Mật khẩu giáo viên
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 font-mono"
              autoFocus
            />
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-red-700 hover:bg-red-800 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <Unlock className="w-4 h-4" /> Mở Cấu Hình
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-red-700" />
            <h2 className="text-xl font-bold text-slate-800">Cấu Hình Backend Google Apps Script & Sheet</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Kết nối Web App HSK với Google Sheet và Google Drive cá nhân của bạn hoàn toàn miễn phí.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {sheetUrl ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-full">
              <Server className="w-3.5 h-3.5" /> Đã kết nối Google Sheet
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full">
              <Database className="w-3.5 h-3.5" /> Chế độ dùng thử (Lưu Local)
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsAuthenticated(false)}
            className="text-xs font-semibold text-slate-500 hover:text-red-700 flex items-center gap-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer"
            title="Khóa cấu hình"
          >
            <Lock className="w-3.5 h-3.5" /> Khóa
          </button>
        </div>
      </div>

      {/* Configuration Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
          <Link2 className="w-5 h-5 text-red-700" /> Đường Dẫn Web App & Mật Khẩu
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Link Web App (Apps Script URL kết thúc bằng <span className="font-mono text-red-600">/exec</span>)
            </label>
            <input
              type="url"
              value={sheetUrl}
              onChange={(e) => setSheetUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 font-mono"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              * Nếu để trống, hệ thống sẽ tự động lưu bài nộp vào bộ nhớ trình duyệt (dùng thử offline).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Mật khẩu giáo viên (để vào trang Chấm Bài)
            </label>
            <input
              type="text"
              value={teacherPass}
              onChange={(e) => setTeacherPass(e.target.value)}
              placeholder="Nhập mật khẩu..."
              className="w-full max-w-xs px-3.5 py-2 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-red-500 font-mono"
            />
          </div>

          {saveStatus && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{saveStatus}</span>
            </div>
          )}

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                testResult.ok
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              className="bg-red-700 hover:bg-red-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition shadow-sm cursor-pointer"
            >
              Lưu Cấu Hình
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-4 py-2.5 rounded-xl text-sm transition cursor-pointer inline-flex items-center gap-1.5"
            >
              <Play className="w-4 h-4" />
              {isTesting ? 'Đang kiểm tra...' : 'Kiểm Tra Kết Nối'}
            </button>
          </div>
        </form>
      </div>

      {/* Step-by-Step Instructions Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600" /> Hướng Dẫn Tạo Google Apps Script (Thực hiện 1 lần)
          </h3>
        </div>

        <div className="space-y-4 text-sm text-slate-700 leading-relaxed">
          {/* Step 1 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">Bước 1 — Tạo Google Sheet & Thư mục Google Drive</h4>
            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
              <li>Tạo 1 Google Sheet mới (Đặt tên ví dụ: "HSK - Nộp Bài").</li>
              <li>Tạo 1 thư mục trên Google Drive (Đặt tên ví dụ: "HSK - Ghi Âm").</li>
              <li>
                Mở thư mục Drive, copy <b>ID thư mục</b> trong URL (phần sau <code className="bg-slate-200 px-1 py-0.5 rounded text-red-700 font-mono">folders/</code>).
              </li>
            </ol>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">Bước 2 — Mở trình chỉnh sửa Apps Script</h4>
            <p className="text-xs text-slate-600">
              Trong Google Sheet vừa tạo: Chọn <b>Tiện ích mở rộng (Extensions)</b> → <b>Apps Script</b>. Xóa toàn bộ code mặc định.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-red-600" /> Bước 3 — Dán Mã Code Apps Script Sau
              </h4>
              <button
                type="button"
                onClick={copyCode}
                className="inline-flex items-center gap-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {codeCopied ? 'Đã chép toàn bộ code!' : 'Sao chép mã Apps Script'}
              </button>
            </div>

            <p className="text-xs text-slate-500">
              * Nhớ thay dòng <code className="bg-amber-100 text-amber-900 px-1 rounded font-mono">DRIVE_FOLDER_ID</code> thành ID thư mục Drive ở Bước 1 và đặt <code className="bg-amber-100 text-amber-900 px-1 rounded font-mono">GV_PASSWORD</code>.
            </p>

            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-xs font-mono max-h-48 overflow-y-auto overflow-x-auto leading-relaxed border border-slate-800">
              {APPS_SCRIPT_CODE}
            </pre>
          </div>

          {/* Step 4 */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <h4 className="font-bold text-slate-900 text-sm">Bước 4 — Triển khai Web App (Deploy)</h4>
            <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
              <li>
                Bấm góc trên bên phải: <b>Triển khai (Deploy)</b> → <b>Bản triển khai mới (New deployment)</b>.
              </li>
              <li>Chọn loại: <b>Ứng dụng web (Web app)</b>.</li>
              <li>
                <b>Thực thi dưới dạng (Execute as)</b>: Chọn <b>Tôi (Me)</b>.
              </li>
              <li>
                <b>Ai có quyền truy cập (Who has access)</b>: Chọn <b>Bất kỳ ai (Anyone)</b>.
              </li>
              <li>
                Bấm <b>Triển khai (Deploy)</b> → Cấp quyền (Nâng cao / Advanced → Đi tới... → Cho phép / Allow).
              </li>
              <li>Copy liên kết Web App dạng <code className="bg-slate-200 text-red-700 px-1 py-0.5 rounded font-mono">.../exec</code> dán vào ô Cấu hình ở trên.</li>
            </ol>
          </div>

          {/* Drive Audio Note */}
          <div className="p-4 bg-teal-50/80 border border-teal-200 rounded-xl space-y-2">
            <h4 className="font-bold text-teal-900 text-sm flex items-center gap-1.5">
              🎙️ Lưu trữ File Nghe & Bài Ghi Âm Luyện Nói Trên Google Drive:
            </h4>
            <ul className="list-disc list-inside text-xs text-teal-800 space-y-1 leading-relaxed">
              <li><b>Bài làm ghi âm học sinh:</b> Mọi bài ghi âm nói của học sinh sẽ tự động được tải lên thư mục Google Drive của giáo viên và tạo liên kết nghe trực tiếp.</li>
              <li><b>File âm thanh bài nghe của giáo viên:</b> Bạn chỉ cần tải file `.mp3` lên Google Drive, bật chia sẻ <i>"Bất kỳ ai có liên kết đều xem được"</i> rồi dán link Drive vào phần Sửa Cấu Hỏi / Tạo Bài Học. Hệ thống sẽ tự động phát trực tiếp trên mọi thiết bị và máy tính!</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
