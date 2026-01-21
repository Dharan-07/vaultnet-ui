import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

interface TestResult {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
}

const FirestoreTest = () => {
  const { user, isAuthenticated } = useAuth();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (name: string, status: TestResult["status"], message?: string) => {
    setResults(prev => 
      prev.map(r => r.name === name ? { ...r, status, message } : r)
    );
  };

  const runTests = async () => {
    if (!user) return;
    
    setIsRunning(true);
    const testNames = [
      "1. Write to users/{uid} (profile)",
      "2. Read from users/{uid}",
      "3. Write to users/{uid}/logins",
      "4. Read from users/{uid}/logins",
      "5. Write to users/{uid}/wallets",
      "6. Read from users/{uid}/wallets", 
      "7. Write to users/{uid}/votes/{modelId}",
      "8. Read from users/{uid}/votes/{modelId}",
      "9. Write to model_votes/{modelId}",
      "10. Read from model_votes/{modelId}",
      "11. Write to trust_scores/{modelId}",
      "12. Read from trust_scores/{modelId}",
      "Cleanup test data"
    ];
    
    setResults(testNames.map(name => ({ name, status: "pending" })));

    const testModelId = 99999; // Use a test model ID that won't conflict

    try {
      // Test 1: Write to users/{uid}
      updateResult(testNames[0], "running");
      const userRef = doc(db, "users", user.id);
      await setDoc(userRef, {
        testField: "test_value",
        testTimestamp: serverTimestamp()
      }, { merge: true });
      updateResult(testNames[0], "success", "Profile doc updated");

      // Test 2: Read from users/{uid}
      updateResult(testNames[1], "running");
      const userSnap = await getDoc(userRef);
      if (userSnap.exists() && userSnap.data().testField === "test_value") {
        updateResult(testNames[1], "success", `Read testField: ${userSnap.data().testField}`);
      } else {
        updateResult(testNames[1], "error", "Could not read test field");
      }

      // Test 3: Write to users/{uid}/logins
      updateResult(testNames[2], "running");
      const loginsRef = collection(db, "users", user.id, "logins");
      const loginDoc = await addDoc(loginsRef, {
        testLogin: true,
        timestamp: serverTimestamp()
      });
      updateResult(testNames[2], "success", `Created login doc: ${loginDoc.id}`);

      // Test 4: Read from users/{uid}/logins
      updateResult(testNames[3], "running");
      const loginSnap = await getDoc(doc(db, "users", user.id, "logins", loginDoc.id));
      if (loginSnap.exists() && loginSnap.data().testLogin === true) {
        updateResult(testNames[3], "success", "Login subcollection readable");
      } else {
        updateResult(testNames[3], "error", "Could not read login doc");
      }

      // Test 5: Write to users/{uid}/wallets
      updateResult(testNames[4], "running");
      const walletsRef = collection(db, "users", user.id, "wallets");
      const walletDoc = await addDoc(walletsRef, {
        testWallet: true,
        address: "0xTEST123",
        timestamp: serverTimestamp()
      });
      updateResult(testNames[4], "success", `Created wallet doc: ${walletDoc.id}`);

      // Test 6: Read from users/{uid}/wallets
      updateResult(testNames[5], "running");
      const walletSnap = await getDoc(doc(db, "users", user.id, "wallets", walletDoc.id));
      if (walletSnap.exists() && walletSnap.data().testWallet === true) {
        updateResult(testNames[5], "success", "Wallets subcollection readable");
      } else {
        updateResult(testNames[5], "error", "Could not read wallet doc");
      }

      // Test 7: Write to users/{uid}/votes/{modelId}
      updateResult(testNames[6], "running");
      const voteRef = doc(db, "users", user.id, "votes", String(testModelId));
      await setDoc(voteRef, {
        modelId: testModelId,
        voteType: "up",
        testVote: true,
        votedAt: serverTimestamp()
      });
      updateResult(testNames[6], "success", "Vote written to subcollection");

      // Test 8: Read from users/{uid}/votes/{modelId}
      updateResult(testNames[7], "running");
      const voteSnap = await getDoc(voteRef);
      if (voteSnap.exists() && voteSnap.data().testVote === true) {
        updateResult(testNames[7], "success", `Vote type: ${voteSnap.data().voteType}`);
      } else {
        updateResult(testNames[7], "error", "Could not read vote doc");
      }

      // Test 9: Write to model_votes/{modelId}
      updateResult(testNames[8], "running");
      const modelVotesRef = doc(db, "model_votes", String(testModelId));
      await setDoc(modelVotesRef, {
        modelId: testModelId,
        upvotes: 1,
        downvotes: 0,
        score: 1,
        testData: true
      });
      updateResult(testNames[8], "success", "model_votes doc created");

      // Test 10: Read from model_votes/{modelId}
      updateResult(testNames[9], "running");
      const modelVotesSnap = await getDoc(modelVotesRef);
      if (modelVotesSnap.exists() && modelVotesSnap.data().testData === true) {
        updateResult(testNames[9], "success", `Score: ${modelVotesSnap.data().score}`);
      } else {
        updateResult(testNames[9], "error", "Could not read model_votes");
      }

      // Test 11: Write to trust_scores/{modelId}
      updateResult(testNames[10], "running");
      const trustRef = doc(db, "trust_scores", String(testModelId));
      await setDoc(trustRef, {
        modelId: testModelId,
        trustScore: 85,
        hash: "test_hash_123",
        testData: true,
        breakdown: { cleanScan: 30, popularFormat: 25, integrityVerified: 30 }
      });
      updateResult(testNames[10], "success", "trust_scores doc created");

      // Test 12: Read from trust_scores/{modelId}
      updateResult(testNames[11], "running");
      const trustSnap = await getDoc(trustRef);
      if (trustSnap.exists() && trustSnap.data().testData === true) {
        updateResult(testNames[11], "success", `Trust score: ${trustSnap.data().trustScore}`);
      } else {
        updateResult(testNames[11], "error", "Could not read trust_scores");
      }

      // Cleanup
      updateResult(testNames[12], "running");
      await deleteDoc(doc(db, "users", user.id, "logins", loginDoc.id));
      await deleteDoc(doc(db, "users", user.id, "wallets", walletDoc.id));
      await deleteDoc(voteRef);
      await deleteDoc(modelVotesRef);
      await deleteDoc(trustRef);
      // Remove test field from profile
      await setDoc(userRef, { testField: null, testTimestamp: null }, { merge: true });
      updateResult(testNames[12], "success", "Test data cleaned up");

    } catch (error: any) {
      console.error("Test error:", error);
      setResults(prev => 
        prev.map(r => r.status === "running" ? { ...r, status: "error", message: error.message } : r)
      );
    }

    setIsRunning(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 container mx-auto py-8">
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Please sign in to run Firestore tests.</p>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Firestore Collection Test
              <Badge variant="outline">User: {user?.id?.slice(0, 8)}...</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              This will test read/write operations on all Firestore collections used by VaultNet.
            </p>

            <Button 
              onClick={runTests} 
              disabled={isRunning}
              className="w-full"
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Tests...
                </>
              ) : (
                "Run All Tests"
              )}
            </Button>

            {results.length > 0 && (
              <div className="space-y-2 mt-4">
                {results.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card"
                  >
                    <div className="flex items-center gap-2">
                      {result.status === "pending" && (
                        <div className="w-5 h-5 rounded-full border-2 border-muted" />
                      )}
                      {result.status === "running" && (
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      )}
                      {result.status === "success" && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {result.status === "error" && (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                      <span className="text-sm font-medium">{result.name}</span>
                    </div>
                    {result.message && (
                      <span className="text-xs text-muted-foreground max-w-[200px] truncate">
                        {result.message}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted rounded-lg">
              <strong>Collections being tested:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>users/{"{uid}"} - User profile</li>
                <li>users/{"{uid}"}/logins - Login audit trail</li>
                <li>users/{"{uid}"}/wallets - Wallet history</li>
                <li>users/{"{uid}"}/votes/{"{modelId}"} - User votes</li>
                <li>model_votes/{"{modelId}"} - Aggregated votes</li>
                <li>trust_scores/{"{modelId}"} - Trust scores</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default FirestoreTest;
