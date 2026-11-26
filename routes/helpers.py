import os
import subprocess
import tempfile
import threading
from bson import ObjectId

def get_doubt_filter(doubt_id):
    try:
        return {"$or": [{"id": doubt_id}, {"_id": ObjectId(doubt_id)}]}
    except Exception:
        return {"id": doubt_id}

def trigger_desktop_notification(title, message):
    def _worker():
        try:
            safe_title = str(title).replace('"', '').replace("'", '').replace("`", "")[:80]
            safe_message = str(message).replace('"', '').replace("'", '').replace("`", "")[:160]
            ps = f"""try {{
[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
$template = [Windows.UI.Notifications.ToastNotificationManager]::GetTemplateContent([Windows.UI.Notifications.ToastTemplateType]::ToastText02)
$textNodes = $template.GetElementsByTagName("text")
$textNodes.Item(0).AppendChild($template.CreateTextNode("{safe_title}")) | Out-Null
$textNodes.Item(1).AppendChild($template.CreateTextNode("{safe_message}")) | Out-Null
$toast = New-Object Windows.UI.Notifications.ToastNotification $template
[Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("{{1AC14E77-02E7-4E5D-B744-2EB1AE5198B7}}\\WindowsPowerShell\\v1.0\\powershell.exe").Show($toast)
}} catch {{
Add-Type -AssemblyName System.Windows.Forms
$notify = New-Object System.Windows.Forms.NotifyIcon
$notify.Icon = [System.Drawing.SystemIcons]::Information
$notify.BalloonTipTitle = "{safe_title}"
$notify.BalloonTipText = "{safe_message}"
$notify.BalloonTipIcon = [System.Windows.Forms.ToolTipIcon]::Info
$notify.Visible = $True
$notify.ShowBalloonTip(5000)
Start-Sleep -Seconds 3
$notify.Dispose()
}}"""
            with tempfile.NamedTemporaryFile("w", suffix=".ps1", delete=False, encoding="utf-8") as f:
                f.write(ps)
                tmp_path = f.name
            try:
                subprocess.run(["powershell", "-ExecutionPolicy", "Bypass", "-File", tmp_path], capture_output=True, text=True, timeout=6)
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)
        except Exception:
            pass
    threading.Thread(target=_worker, daemon=True).start()

