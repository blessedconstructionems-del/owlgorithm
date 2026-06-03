import AuthenticationServices
import UIKit
import WebKit

final class OwlgorithmSocialBridge: NSObject, WKScriptMessageHandler, ASWebAuthenticationPresentationContextProviding {
    static let handlerNames = ["owlgorithmSocialConnect", "openSocialConnect"]

    private weak var webView: WKWebView?
    private weak var presentationView: UIView?
    private var authSession: ASWebAuthenticationSession?

    init(webView: WKWebView, presentationView: UIView) {
        self.webView = webView
        self.presentationView = presentationView
        super.init()
    }

    func install() {
        let contentController = webView?.configuration.userContentController
        Self.handlerNames.forEach { contentController?.add(self, name: $0) }
    }

    func uninstall() {
        let contentController = webView?.configuration.userContentController
        Self.handlerNames.forEach { contentController?.removeScriptMessageHandler(forName: $0) }
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard let url = connectURL(from: message.body) else {
            emitCompletion(status: "failed", callbackURL: nil, error: "Missing Upload-Post connect URL")
            return
        }

        let session = ASWebAuthenticationSession(url: url, callbackURLScheme: callbackURLScheme(from: message.body)) { [weak self] callbackURL, error in
            if let error {
                self?.emitCompletion(status: "failed", callbackURL: callbackURL, error: error.localizedDescription)
            } else {
                self?.emitCompletion(status: "completed", callbackURL: callbackURL, error: nil)
            }
        }
        session.presentationContextProvider = self
        session.prefersEphemeralWebBrowserSession = false
        authSession = session
        session.start()
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        presentationView?.window ?? ASPresentationAnchor()
    }

    private func connectURL(from body: Any) -> URL? {
        if let urlString = body as? String {
            return URL(string: urlString)
        }

        if let payload = body as? [String: Any], let urlString = payload["url"] as? String {
            return URL(string: urlString)
        }

        return nil
    }

    private func callbackURLScheme(from body: Any) -> String? {
        guard
            let payload = body as? [String: Any],
            let scheme = payload["callbackURLScheme"] as? String,
            !scheme.isEmpty
        else { return nil }

        return scheme
    }

    private func emitCompletion(status: String, callbackURL: URL?, error: String?) {
        let detail: [String: String] = [
            "status": status,
            "callbackURL": callbackURL?.absoluteString ?? "",
            "error": error ?? ""
        ]
        guard
            let data = try? JSONSerialization.data(withJSONObject: detail),
            let json = String(data: data, encoding: .utf8)
        else { return }

        webView?.evaluateJavaScript(
            "window.dispatchEvent(new CustomEvent('owlgorithm:social-connect-complete', { detail: \(json) }));"
        )
    }
}
